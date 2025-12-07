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
import type { UserNoteRecord } from "../../shared/types";
import { generateOpenAiStack } from "../../shared/openAiNotes";
import type { FlashcardStackResponse } from "../../shared/openAiNotes";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;
const maxContentLength = 100000;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

interface IncomingPayload {
  url: string;
  payload?: string;
  content?: string;
  topic?: string;
  requirements?: string;
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

  let stack: FlashcardStackResponse;
  try {
    stack = await generateOpenAiStack({
      url: normalizedUrl,
      content: normalizedPayload,
      topic,
      requirements,
      metadata: { source: "direct-request" },
    });
  } catch (error) {
    console.error("Failed to generate flashcards via OpenAI", error);
    return internalError();
  }

  const newCardsCount = stack.cards.length;
  const now = new Date().toISOString();

  if (existingNote) {
    const existingCards = existingNote.cards ?? [];
    const updatedCards = newCardsCount > 0 ? stack.cards : existingCards;
    const nextSummary = stack.summary ?? existingNote.summary ?? null;

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
        console.error("Failed to update existing note", error);
        return internalError();
      }
    }

    return jsonResponse(200, {
      noteId: existingNote.noteId,
      url: normalizedUrl,
      topic: existingNote.topic ?? stack.topic,
      summary: nextSummary,
      cards: newCardsCount > 0 ? stack.cards : existingCards,
      createdAt: existingNote.createdAt,
      lastReviewedAt: existingNote.lastReviewedAt ?? null,
      lastReviewStatus: existingNote.lastReviewStatus ?? null,
      reviewIntervalSeconds: existingNote.reviewIntervalSeconds ?? null,
      reviewEaseFactor: existingNote.reviewEaseFactor ?? null,
      reviewRepetitions: existingNote.reviewRepetitions ?? null,
      nextReviewDate: existingNote.nextReviewDate ?? null,
      newCards: newCardsCount,
      totalCards:
        newCardsCount > 0 ? stack.cards.length : existingNote.cards?.length ?? 0,
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

  await docClient.send(
    new PutCommand({
      TableName: userNotesTableName,
      Item: record,
    })
  );

  return jsonResponse(200, {
    noteId,
    url: normalizedUrl,
    topic: stack.topic,
    summary: stack.summary,
    cards: stack.cards,
    createdAt: now,
    lastReviewedAt: null,
    lastReviewStatus: null,
    reviewIntervalSeconds: null,
    reviewEaseFactor: null,
    reviewRepetitions: null,
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

export const __testHelpers = {
  generateOpenAiStack,
};
