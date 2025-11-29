import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";
import {
  badRequest,
  internalError,
  jsonResponse,
  unauthorized,
} from "../../shared/http";
import type { UserNoteRecord } from "../../shared/types";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
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

  const rawUrl = event.queryStringParameters?.url;
  if (!rawUrl) {
    return badRequest("url query parameter is required");
  }

  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl) {
    return badRequest("url must be a valid HTTP or HTTPS URL");
  }

  try {
    const query = new QueryCommand({
      TableName: userNotesTableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ProjectionExpression:
        "noteId, sourceUrl, topic, summary, cards, createdAt, lastReviewedAt, lastReviewStatus, reviewIntervalSeconds, reviewEaseFactor, reviewRepetitions, nextReviewDate",
    });
    const result = await docClient.send(query);
    const items = (result.Items as UserNoteRecord[] | undefined) ?? [];
    const match = items.find((note) => note.sourceUrl === normalizedUrl);

    if (!match) {
      return jsonResponse(404, { message: "Note not found" });
    }

    return jsonResponse(200, mapNote(match));
  } catch (error) {
    console.error("Failed to load existing general note", error);
    return internalError();
  }
};

function mapNote(note: UserNoteRecord) {
  return {
    noteId: note.noteId,
    url: note.sourceUrl,
    topic: note.topic ?? null,
    summary: note.summary ?? null,
    cards: note.cards ?? [],
    createdAt: note.createdAt,
    lastReviewedAt: note.lastReviewedAt ?? null,
    lastReviewStatus: note.lastReviewStatus ?? null,
    reviewIntervalSeconds: note.reviewIntervalSeconds ?? null,
    reviewEaseFactor: note.reviewEaseFactor ?? null,
    reviewRepetitions: note.reviewRepetitions ?? null,
    nextReviewDate: note.nextReviewDate ?? null,
  };
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
