import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

  const noteId = event.pathParameters?.noteId;
  const cardId = event.pathParameters?.cardId;
  if (!noteId || !cardId) {
    return badRequest("noteId and cardId path parameters are required");
  }

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error("Authenticated user missing email identifier");
    return internalError();
  }

  let note: UserNoteRecord | null;
  try {
    note = await loadNote(userId, noteId);
  } catch (error) {
    console.error("Failed to load note for delete operation", error);
    return internalError();
  }
  if (!note) {
    return jsonResponse(404, { message: "Note not found" });
  }

  const existingCards = note.cards ?? [];
  if (existingCards.length === 0) {
    return jsonResponse(404, { message: "Card not found" });
  }

  const filteredCards = existingCards.filter((card) => card.id !== cardId);
  if (filteredCards.length === existingCards.length) {
    return jsonResponse(404, { message: "Card not found" });
  }

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: userNotesTableName,
        Key: { userId, noteId },
        UpdateExpression: "SET cards = :cards, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":cards": filteredCards,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("Failed to delete card", error);
    return internalError();
  }

  return jsonResponse(200, {
    noteId,
    cards: filteredCards,
  });
};

async function loadNote(
  userId: string,
  noteId: string
): Promise<UserNoteRecord | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: userNotesTableName,
        Key: { userId, noteId },
      })
    );
    return (result.Item as UserNoteRecord | undefined) ?? null;
  } catch (error) {
    console.error("Failed to load note", error);
    throw error;
  }
}
