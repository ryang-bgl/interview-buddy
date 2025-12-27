import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";
import {
  internalError,
  jsonResponse,
  unauthorized,
  notFound,
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

  const noteId = event.pathParameters?.noteId;
  if (!noteId) {
    return jsonResponse(400, { message: "noteId path parameter is required" });
  }

  try {
    const command = new GetCommand({
      TableName: userNotesTableName,
      Key: {
        userId: userId,
        noteId: noteId,
      },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return notFound("Note not found");
    }

    const note = result.Item as UserNoteRecord;

    return jsonResponse(200, {
      noteId: note.noteId ?? "",
      url: note.sourceUrl,
      topic: note.topic ?? null,
      summary: note.summary ?? null,
      cards: note.cards ?? [],
      createdAt: note.createdAt ?? "",
      lastReviewedAt: note.lastReviewedAt ?? null,
      lastReviewStatus: note.lastReviewStatus ?? null,
      reviewIntervalSeconds: note.reviewIntervalSeconds ?? null,
      reviewEaseFactor: note.reviewEaseFactor ?? null,
      reviewRepetitions: note.reviewRepetitions ?? null,
      nextReviewDate: note.nextReviewDate ?? null,
      tags: note.tags ?? [],
      cardCount: note.cardCount ?? null,
    });
  } catch (error) {
    console.error("Failed to load general note by ID", error);
    return internalError();
  }
};
