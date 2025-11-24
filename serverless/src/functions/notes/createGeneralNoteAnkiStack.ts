import crypto from "node:crypto";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  badRequest,
  internalError,
  jsonResponse,
  unauthorized,
} from "../../shared/http";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";
import type { UserNoteCardRecord, UserNoteRecord } from "../../shared/types";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekApiUrl =
  process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/chat/completions";
const deepseekModel = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const maxContentLength = 8000;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

if (!deepseekApiKey) {
  throw new Error("DEEPSEEK_API_KEY env var must be set");
}

interface IncomingPayload {
  url: string;
  payload?: string;
  content?: string;
  topic?: string;
  requirements?: string;
}

interface StackResponse {
  topic: string;
  summary: string | null;
  cards: UserNoteCardRecord[];
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let auth;
  try {
    auth = await authenticateRequest(event);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message);
    }
    console.error("Unexpected authentication error", error);
    return internalError();
  }

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error("Authenticated user missing email identifier");
    return internalError();
  }

  const decodedBody = decodeBody(event.body, event.isBase64Encoded);
  if (!decodedBody) {
    return badRequest("Request body is required");
  }

  let payload: IncomingPayload;
  try {
    payload = JSON.parse(decodedBody);
  } catch {
    return badRequest("Body must be valid JSON");
  }

  const normalizedUrl = normalizeUrl(payload.url);
  if (!normalizedUrl) {
    return badRequest("url must be a valid HTTP or HTTPS URL");
  }

  const normalizedPayload = sanitizeText(payload.payload ?? payload.content);
  if (!normalizedPayload) {
    return badRequest("payload is required");
  }

  const topic = optionalText(payload.topic);
  const requirements = optionalText(payload.requirements);

  let stack: StackResponse;
  try {
    stack = await generateAnkiStack({
      url: normalizedUrl,
      content: normalizedPayload,
      topic,
      requirements,
    });
  } catch (error) {
    console.error("Failed to generate flashcards via DeepSeek", error);
    return internalError();
  }

  const noteId = crypto.randomUUID();
  const now = new Date().toISOString();
  const record: UserNoteRecord = {
    userId,
    noteId,
    sourceUrl: normalizedUrl,
    topic: stack.topic,
    summary: stack.summary ?? undefined,
    requestPayload: {
      url: normalizedUrl,
      payload: normalizedPayload,
      topic,
      requirements,
    },
    cards: stack.cards,
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: null,
    lastReviewStatus: null,
  };

  const putCommand = new PutCommand({
    TableName: userNotesTableName,
    Item: record,
  });

  try {
    await docClient.send(putCommand);
  } catch (error) {
    console.error("Failed to persist user note record", error);
    return internalError();
  }

  return jsonResponse(200, {
    noteId,
    url: normalizedUrl,
    topic: stack.topic,
    summary: stack.summary,
    cards: stack.cards,
    createdAt: now,
    lastReviewedAt: null,
    lastReviewStatus: null,
  });
};

function decodeBody(
  body: string | undefined,
  isBase64Encoded?: boolean
): string | null {
  if (!body) {
    return null;
  }
  if (isBase64Encoded) {
    return Buffer.from(body, "base64").toString("utf-8");
  }
  return body;
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= maxContentLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxContentLength)}...`;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function generateAnkiStack(input: {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
}): Promise<StackResponse> {
  const systemPrompt =
    "You are a tutor specialised to help the candidate pass technical interviews at companies like Facebook or Google. Interviews span system design and behavioural rounds. Your job is to analyse the provided material and craft the best plan for the candidate to master the knowledge.";

  const userPromptSegments = [
    `Analyze the content from url ${input.url}.`,
    input.topic ? `Treat the topic as: ${input.topic}.` : null,
    input.requirements
      ? `Respect these additional requirements: ${input.requirements}.`
      : null,
    "Turn the content into Anki-style stack cards so I can review them repeatedly.",
    "Do not be overly concise—cover every important insight from the provided material.",
    'Respond strictly in JSON using this structure: {"title": "Meaningful title", "tags": ["SystemDesign"], "cards": [{"front": "question", "back": "detailed answer", "extra"?: "tips"}]}.',
    'Each tag in the payload must be one of the following enum values: "SystemDesign", "Behaviour", "Algo", "Other".',
    "Here is the raw content, bounded by triple quotes:",
    '"""',
    input.content,
    '"""',
  ].filter(Boolean);

  const userPrompt = userPromptSegments.join("\n");

  const response = await fetch(deepseekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const body = await safeReadJson(response);
  console.log("====response", body);

  if (!response.ok) {
    console.error("DeepSeek API error", response.status, body);
    throw new Error("DeepSeek generation failed");
  }

  const aiContent = body?.choices?.[0]?.message?.content;
  if (typeof aiContent !== "string") {
    throw new Error("DeepSeek response missing content");
  }

  return parseStackPayload(aiContent, input.topic);
}

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse DeepSeek JSON response", error);
    return null;
  }
}

function parseStackPayload(
  raw: string,
  fallbackTopic: string | null
): StackResponse {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("Unable to parse DeepSeek payload", { raw });
    throw error;
  }

  const topic =
    optionalText(parsed?.title) ?? fallbackTopic ?? "Interview study stack";
  const cardsInput: unknown[] = Array.isArray(parsed?.cards)
    ? parsed.cards
    : [];
  const cards: UserNoteCardRecord[] = cardsInput
    .map((card: any, index: number) => normalizeCard(card, index))
    .filter((card): card is UserNoteCardRecord => Boolean(card));

  if (cards.length === 0) {
    throw new Error("DeepSeek response did not contain any cards");
  }

  return { topic, summary: null, cards };
}

function normalizeCard(card: any, index: number): UserNoteCardRecord | null {
  const front = optionalText(card?.front);
  const back = optionalText(card?.back);
  if (!front || !back) {
    return null;
  }

  const extra = optionalText(card?.extra);
  const tags = Array.isArray(card?.tags)
    ? card.tags
        .map((tag: unknown) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag: string) => Boolean(tag))
    : undefined;

  return {
    id: optionalText(card?.id) ?? `card-${index + 1}`,
    front,
    back,
    extra: extra ?? undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
  };
}
