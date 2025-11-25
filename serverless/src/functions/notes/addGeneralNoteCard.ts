import crypto from "node:crypto";
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
import type { UserNoteCardRecord, UserNoteRecord } from "../../shared/types";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

interface AddCardRequest {
  id?: string | null;
  front?: string | null;
  back?: string | null;
  extra?: string | null;
  tags?: string[] | null;
  insertAfterCardId?: string | null;
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
  if (!noteId) {
    return badRequest("noteId path parameter is required");
  }

  const payload = parseBody(event.body);
  if (!payload) {
    return badRequest("Request body must be valid JSON");
  }

  const front = sanitizeText(payload.front);
  const back = sanitizeText(payload.back);
  const extra = sanitizeText(payload.extra);
  const insertAfterRaw = payload.insertAfterCardId;
  const insertAtBeginning = insertAfterRaw === null;
  const insertAfterCardId =
    typeof insertAfterRaw === "string" ? insertAfterRaw.trim() : null;
  const tags = sanitizeTags(payload.tags);

  if (!front || !back) {
    return badRequest("front and back fields are required");
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
    console.error("Failed to load note for add operation", error);
    return internalError();
  }
  if (!note) {
    return jsonResponse(404, { message: "Note not found" });
  }

  const newCard: UserNoteCardRecord = {
    id: sanitizeText(payload.id) ?? `card-${crypto.randomUUID()}`,
    front,
    back,
    extra: extra ?? undefined,
    tags: tags ?? undefined,
  };

  const existingCards = [...(note.cards ?? [])];
  let insertIndex = existingCards.length;
  if (insertAtBeginning) {
    insertIndex = 0;
  } else if (insertAfterCardId) {
    const foundIndex = existingCards.findIndex(
      (card) => card.id === insertAfterCardId
    );
    insertIndex = foundIndex >= 0 ? foundIndex + 1 : existingCards.length;
  }

  const updatedCards = [...existingCards];
  updatedCards.splice(insertIndex, 0, newCard);

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: userNotesTableName,
        Key: { userId, noteId },
        UpdateExpression: "SET cards = :cards, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":cards": updatedCards,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("Failed to append card", error);
    return internalError();
  }

  return jsonResponse(200, {
    noteId,
    card: newCard,
    cards: updatedCards,
  });
};

function parseBody(body: string | undefined | null): AddCardRequest | null {
  if (!body) {
    return null;
  }
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === "object") {
      return parsed as AddCardRequest;
    }
    return null;
  } catch (error) {
    console.warn("Failed to parse add-card payload", error);
    return null;
  }
}

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

function sanitizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeTags(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const sanitized = value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0);
  return sanitized.length > 0 ? sanitized : null;
}
