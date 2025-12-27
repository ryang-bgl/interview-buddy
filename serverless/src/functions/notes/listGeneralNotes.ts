import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";
import { internalError, jsonResponse, unauthorized } from "../../shared/http";
import type { UserNoteRecord } from "../../shared/types";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

interface NoteSummary {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: string | null;
  cardCount: number | null;
  tags: string[];
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
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

  try {
    const query = new QueryCommand({
      TableName: userNotesTableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ProjectionExpression:
        "noteId, sourceUrl, topic, summary, cardCount, tags, createdAt, lastReviewedAt, lastReviewStatus, reviewIntervalSeconds, reviewEaseFactor, reviewRepetitions, nextReviewDate",
    });
    const result = await docClient.send(query);
    const items = (result.Items as UserNoteRecord[] | undefined) ?? [];

    const summaries: NoteSummary[] = items
      .map((note) => mapToSummary(note))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return jsonResponse(200, { notes: summaries });
  } catch (error) {
    console.error("Failed to list general notes", error);
    return internalError();
  }
};

function mapToSummary(note: UserNoteRecord): NoteSummary {
  // Use stored cardCount and tags, return null if not available
  const cardCount = note.cardCount ?? null;
  const tags = note.tags ?? [];

  return {
    noteId: note.noteId ?? "",
    url: note.sourceUrl,
    topic: note.topic ?? null,
    summary: note.summary ?? null,
    createdAt: note.createdAt ?? "",
    lastReviewedAt: note.lastReviewedAt ?? null,
    lastReviewStatus: note.lastReviewStatus ?? null,
    cardCount,
    tags,
    reviewIntervalSeconds: note.reviewIntervalSeconds ?? null,
    reviewEaseFactor: note.reviewEaseFactor ?? null,
    reviewRepetitions: note.reviewRepetitions ?? null,
    nextReviewDate: note.nextReviewDate ?? null,
  };
}
