import crypto from "node:crypto";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
import { chunkArticleContent } from "../../shared/noteChunker";

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

interface FlashcardAnchor {
  front: string;
  back: string;
  extra?: string | null;
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

  let existingNote: UserNoteRecord | null = null;
  try {
    existingNote = await findExistingNote(userId, normalizedUrl);
  } catch (error) {
    console.error("Failed to query existing note for continuation", error);
    return internalError();
  }

  const initialAnchor = buildAnchorFromCard(
    existingNote?.cards?.[existingNote.cards.length - 1]
  );

  let stack: StackResponse;
  try {
    stack = await generateCompleteStack({
      url: normalizedUrl,
      content: normalizedPayload,
      topic,
      requirements,
      initialAnchor,
    });
  } catch (error) {
    console.error("Failed to generate flashcards via DeepSeek", error);
    return internalError();
  }

  const newCardsCount = stack.cards.length;
  const now = new Date().toISOString();

  if (existingNote) {
    const existingCards = existingNote.cards ?? [];
    const updatedCards =
      newCardsCount > 0 ? [...existingCards, ...stack.cards] : existingCards;
    const nextSummary = existingNote.summary ?? stack.summary ?? null;

    if (newCardsCount > 0) {
      const updateParts = ["cards = :cards", "updatedAt = :updatedAt"];
      const names: Record<string, string> = {};
      const values: Record<string, unknown> = {
        ":cards": updatedCards,
        ":updatedAt": now,
      };
      if (nextSummary) {
        updateParts.push("#summary = :summary");
        names["#summary"] = "summary";
        values[":summary"] = nextSummary;
      }
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: userNotesTableName,
            Key: { userId, noteId: existingNote.noteId },
            UpdateExpression: `SET ${updateParts.join(", ")}`,
            ExpressionAttributeNames:
              Object.keys(names).length > 0 ? names : undefined,
            ExpressionAttributeValues: values,
          })
        );
      } catch (error) {
        console.error("Failed to append cards to existing note", error);
        return internalError();
      }
    }

    return jsonResponse(200, {
      noteId: existingNote.noteId,
      url: normalizedUrl,
      topic: existingNote.topic ?? stack.topic,
      summary: nextSummary,
      cards: updatedCards,
      createdAt: existingNote.createdAt,
      lastReviewedAt: existingNote.lastReviewedAt ?? null,
      lastReviewStatus: existingNote.lastReviewStatus ?? null,
      reviewIntervalSeconds: existingNote.reviewIntervalSeconds ?? null,
      reviewEaseFactor: existingNote.reviewEaseFactor ?? null,
      reviewRepetitions: existingNote.reviewRepetitions ?? null,
      nextReviewDate: existingNote.nextReviewDate ?? null,
      newCards: newCardsCount,
      totalCards: updatedCards.length,
    });
  }

  if (newCardsCount === 0) {
    return jsonResponse(200, {
      noteId: null,
      url: normalizedUrl,
      topic: topic ?? stack.topic,
      summary: stack.summary,
      cards: [],
      newCards: 0,
      totalCards: 0,
    });
  }

  const noteId = crypto.randomUUID();
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
    reviewIntervalSeconds: undefined,
    reviewEaseFactor: undefined,
    reviewRepetitions: undefined,
    nextReviewDate: null,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: userNotesTableName,
        Item: record,
      })
    );
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
    reviewIntervalSeconds: undefined,
    reviewEaseFactor: undefined,
    reviewRepetitions: undefined,
    nextReviewDate: null,
    newCards: newCardsCount,
    totalCards: stack.cards.length,
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

async function findExistingNote(
  userId: string,
  url: string
): Promise<UserNoteRecord | null> {
  const query = new QueryCommand({
    TableName: userNotesTableName,
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "sourceUrl = :sourceUrl",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":sourceUrl": url,
    },
    Limit: 1,
  });

  try {
    const result = await docClient.send(query);
    const items = (result.Items as UserNoteRecord[] | undefined) ?? [];
    return items[0] ?? null;
  } catch (error) {
    console.error("Failed to load existing note", error);
    throw error;
  }
}

function buildAnchorFromCard(
  card?: UserNoteCardRecord
): FlashcardAnchor | null {
  if (!card) {
    return null;
  }
  return {
    front: card.front,
    back: card.back,
    extra: card.extra ?? null,
  };
}

async function generateCompleteStack(input: {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
  initialAnchor?: FlashcardAnchor | null;
}): Promise<StackResponse> {
  const aggregated: UserNoteCardRecord[] = [];
  let derivedTopic: string | null = null;
  const segments = chunkArticleContent(input.content, {
    anchor: input.initialAnchor ?? undefined,
    targetSize: 500,
    overlapBlocks: 2,
  });

  const chunks = segments.length > 0 ? segments : [input.content];
  const formatCardForLog = (card?: UserNoteCardRecord) => {
    if (!card) {
      return "n/a";
    }
    const front = card.front.replace(/\s+/g, " ").slice(0, 80);
    const back = card.back.replace(/\s+/g, " ").slice(0, 80);
    return `Front: ${front || "(empty)"} | Back: ${back || "(empty)"}`;
  };

  for (let index = 0; index < chunks.length; index += 1) {
    const chunkContent = chunks[index];
    const chunk = await generateAnkiStack({
      ...input,
      content: chunkContent,
      anchorCard: null,
    });
    if (!derivedTopic && chunk.topic) {
      derivedTopic = chunk.topic;
    }
    if (!chunk.cards.length) {
      console.info(
        "[general-note] Chunk %d returned 0 cards; stopping.",
        index + 1
      );
      continue;
    }
    aggregated.push(...chunk.cards);
    console.info(
      "[general-note] Chunk %d produced %d cards (total=%d). First=%s, Last=%s",
      index + 1,
      chunk.cards.length,
      aggregated.length,
      formatCardForLog(chunk.cards[0]),
      formatCardForLog(chunk.cards[chunk.cards.length - 1])
    );
  }

  return {
    topic: derivedTopic ?? input.topic ?? "Interview study stack",
    summary: null,
    cards: aggregated,
  };
}

async function generateAnkiStack(input: {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
  anchorCard?: FlashcardAnchor | null;
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
    input.anchorCard
      ? [
          "Resume from the point immediately after the last saved flashcard.",
          `Previous front: ${input.anchorCard.front}`,
          `Previous back: ${input.anchorCard.back}`,
          input.anchorCard.extra
            ? `Previous extra: ${input.anchorCard.extra}`
            : null,
          "Locate where that flashcard content appears in the provided text, make sure you don't repeat it, then continue generating cards right after that location.",
        ].join("\n")
      : "Start from the beginning of the provided content.",
    "Break the material into logical sections (headings, paragraphs, phases) and create at least one card per important idea.",
    "Add summary cards that capture the most critical takeaways for each major section before diving into supporting details.",
    "Generate as many cards as needed to cover the entire source material—avoid arbitrary limits like 10 cards; long-form content should typically yield dozens of cards.",
    "Do not be overly concise—cover every important insight from the provided material.",
    'If there is nothing left after the anchor point, respond with the JSON payload but set "cards" to an empty array.',
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
    console.error(
      "==== generateAnkiStack, error in deepseek response aiContent",
      JSON.stringify(aiContent)
    );

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
    .map((card: any) => normalizeCard(card))
    .filter((card): card is UserNoteCardRecord => Boolean(card));

  return { topic, summary: null, cards };
}

function normalizeCard(card: any): UserNoteCardRecord | null {
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
    id: crypto.randomUUID(),
    front,
    back,
    extra: extra ?? undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
  };
}

export const __testHelpers = {
  generateCompleteStack,
  generateAnkiStack,
};
