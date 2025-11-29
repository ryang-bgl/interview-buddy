import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "../../shared/dynamodb";
import { authenticateRequest, UnauthorizedError } from "../../shared/supabaseAuth";
import { badRequest, internalError, jsonResponse, unauthorized } from "../../shared/http";
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

  const noteId = event.pathParameters?.noteId?.trim();
  if (!noteId) {
    return badRequest("noteId path parameter is required");
  }

  const payload = parsePayload(event.body, event.isBase64Encoded);
  if (!payload?.lastReviewedAt || !payload?.nextReviewDate) {
    return badRequest("lastReviewedAt and nextReviewDate are required");
  }

  const command = new UpdateCommand({
    TableName: userNotesTableName,
    Key: { userId, noteId },
    UpdateExpression:
      "SET lastReviewedAt = :lastReviewedAt, lastReviewStatus = :lastReviewStatus, reviewIntervalSeconds = :reviewIntervalSeconds, reviewEaseFactor = :reviewEaseFactor, reviewRepetitions = :reviewRepetitions, nextReviewDate = :nextReviewDate, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":lastReviewedAt": payload.lastReviewedAt,
      ":lastReviewStatus": payload.lastReviewStatus ?? null,
      ":reviewIntervalSeconds": payload.reviewIntervalSeconds ?? null,
      ":reviewEaseFactor": payload.reviewEaseFactor ?? null,
      ":reviewRepetitions": payload.reviewRepetitions ?? null,
      ":nextReviewDate": payload.nextReviewDate,
      ":updatedAt": new Date().toISOString(),
    },
    ConditionExpression: "attribute_exists(noteId)",
    ReturnValues: "ALL_NEW",
  });

  try {
    const { Attributes } = await docClient.send(command);
    if (!Attributes) {
      return internalError();
    }
    return jsonResponse(200, mapNote(Attributes as UserNoteRecord));
  } catch (error: any) {
    if (error?.name === "ConditionalCheckFailedException") {
      return badRequest("Note not found");
    }
    console.error("Failed to update note review metadata", error);
    return internalError();
  }
};

interface ReviewPayload {
  lastReviewedAt: string;
  nextReviewDate: string;
  lastReviewStatus?: string;
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
}

function parsePayload(body: string | undefined, isBase64?: boolean): ReviewPayload | null {
  if (!body) {
    return null;
  }
  const decoded = isBase64 ? Buffer.from(body, "base64").toString("utf-8") : body;
  try {
    const payload = JSON.parse(decoded);
    const lastReviewedValue = payload.lastReviewedAt ?? payload.reviewedAt;
    const nextReviewValue = payload.nextReviewDate ?? payload.dueAt;
    if (!lastReviewedValue || !nextReviewValue) {
      return null;
    }
    const lastReviewed = new Date(lastReviewedValue);
    const nextReview = new Date(nextReviewValue);
    if (Number.isNaN(lastReviewed.getTime()) || Number.isNaN(nextReview.getTime())) {
      return null;
    }
    const status = typeof payload.lastReviewStatus === "string" ? payload.lastReviewStatus : undefined;
    return {
      lastReviewedAt: lastReviewed.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      lastReviewStatus: status,
      reviewIntervalSeconds: parseNumeric(payload.reviewIntervalSeconds),
      reviewEaseFactor: parseNumeric(payload.reviewEaseFactor),
      reviewRepetitions: parseNumeric(payload.reviewRepetitions),
    };
  } catch {
    return null;
  }
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapNote(record: UserNoteRecord) {
  return {
    noteId: record.noteId,
    url: record.sourceUrl,
    topic: record.topic ?? null,
    summary: record.summary ?? null,
    cards: record.cards,
    createdAt: record.createdAt,
    lastReviewedAt: record.lastReviewedAt ?? null,
    lastReviewStatus: record.lastReviewStatus ?? null,
    reviewIntervalSeconds: record.reviewIntervalSeconds ?? null,
    reviewEaseFactor: record.reviewEaseFactor ?? null,
    reviewRepetitions: record.reviewRepetitions ?? null,
    nextReviewDate: record.nextReviewDate ?? null,
  };
}
