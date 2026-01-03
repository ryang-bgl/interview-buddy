import crypto from "node:crypto";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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
import { findNoteByUrl } from "../../shared/notes";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;
const openAiApiUrl =
  process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";
const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_MAX_TOKENS = 8000;
const maxContentLength = 100000;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

interface IncomingPayload {
  url: string;
  content: string;
  topic?: string;
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

  const normalizedContent = sanitizeText(payload.content);
  if (!normalizedContent) {
    return badRequest("content is required");
  }

  const topic = optionalText(payload.topic);

  try {
    // Generate the summary
    const summary = await generateSummary(normalizedContent, topic);

    // Save or update the note in DynamoDB
    const noteId = await saveOrUpdateNote({
      userId,
      url: normalizedUrl,
      topic,
      summary,
    });

    return jsonResponse(200, { summary, noteId });
  } catch (error) {
    console.error("Failed to generate summary", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate summary";
    return internalError(message);
  }
};

async function saveOrUpdateNote(params: {
  userId: string;
  url: string;
  topic: string | null;
  summary: string;
}): Promise<string> {
  const { userId, url, topic, summary } = params;

  // Check if a note already exists for this URL
  const existingNote = await findNoteByUrl({
    tableName: userNotesTableName,
    userId,
    url,
  });

  const now = new Date().toISOString();

  if (existingNote) {
    // Update existing note with summary
    await docClient.send(
      new UpdateCommand({
        TableName: userNotesTableName,
        Key: {
          userId,
          noteId: existingNote.noteId,
        },
        UpdateExpression:
          "SET #summary = :summary, #topic = :topic, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#summary": "summary",
          "#topic": "topic",
        },
        ExpressionAttributeValues: {
          ":summary": summary,
          ":topic": topic ?? existingNote.topic ?? null,
          ":updatedAt": now,
        },
      })
    );
    console.info("[summary] Updated existing note", {
      userId,
      noteId: existingNote.noteId,
      url,
    });
    return existingNote.noteId;
  } else {
    // Create new note with summary
    const noteId = crypto.randomUUID();
    await docClient.send(
      new PutCommand({
        TableName: userNotesTableName,
        Item: {
          userId,
          noteId,
          sourceUrl: url,
          topic: topic ?? undefined,
          summary,
          cards: [],
          cardCount: 0,
          tags: [],
          createdAt: now,
          updatedAt: now,
          lastReviewedAt: null,
          lastReviewStatus: null,
          reviewIntervalSeconds: undefined,
          reviewEaseFactor: undefined,
          reviewRepetitions: undefined,
          nextReviewDate: null,
        },
      })
    );
    console.info("[summary] Created new note", {
      userId,
      noteId,
      url,
    });
    return noteId;
  }
}

async function generateSummary(
  content: string,
  topic: string | null
): Promise<string> {
  const openAiApiKey = requireOpenAiKey();
  const systemPrompt =
    "You are a technical interviewer and tutor specializing in system design and behavioral interview preparation. Your job is to analyze the provided material and create a comprehensive, well-structured summary in markdown format.";

  const userPrompt = [
    topic ? `Topic: ${topic}` : "",
    "Create a comprehensive summary of the provided markdown content for system design and behavioral interview preparation.",
    "IMPORTANT INSTRUCTIONS:",
    "- Do NOT miss any main points or key concepts",
    "- Preserve ALL technical details, architectural patterns, and behavioral frameworks",
    "- Keep the output in valid markdown format with proper headings (using #), lists, code blocks, etc.",
    "- Organize the content logically with clear sections and subsections",
    "- Include examples, diagrams descriptions, and key takeaways",
    "- For system design: cover scalability, reliability, trade-offs, and implementation details",
    "- For behavioral content: cover frameworks, STAR method examples, and key insights",
    "- The summary should be thorough enough for interview preparation - err on the side of more detail rather than less",
    "- Do NOT truncate or omit sections - capture ALL important content",
    "",
    "Here is the markdown content to summarize, bounded by triple quotes:",
    '"""',
    content,
    '"""',
  ]
    .filter(Boolean)
    .join("\n");

  console.info("[summary] Requesting AI summary", {
    contentLength: content.length,
  });

  const apiStart = Date.now();
  const response = await fetch(openAiApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
    }),
  });

  const body = await safeReadJson(response);
  if (!response.ok) {
    console.error("[summary] API error", response.status, body);
    throw new Error("OpenAI generation failed");
  }

  const summary = body?.choices?.[0]?.message?.content;
  if (typeof summary !== "string") {
    throw new Error("OpenAI response missing content");
  }

  console.info("[summary] AI summary generated", {
    durationMs: Date.now() - apiStart,
    summaryLength: summary.length,
  });
  return summary;
}

function requireOpenAiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY env var must be set");
  }
  return apiKey;
}

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse OpenAI JSON response", error);
    return null;
  }
}

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
