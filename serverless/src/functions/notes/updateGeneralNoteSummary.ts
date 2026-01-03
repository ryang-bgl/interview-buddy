import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
import { findNoteById } from "../../shared/notes";

const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

interface IncomingPayload {
  summary?: string;
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

  // Get noteId from path parameter
  const noteId = event.pathParameters?.noteId;
  if (!noteId) {
    return badRequest("noteId is required");
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

  const { summary, topic } = payload;

  if (!summary && !topic) {
    return badRequest("At least one of summary or topic must be provided");
  }

  try {
    // Check if note exists and belongs to user
    const existingNote = await findNoteById(userNotesTableName, userId, noteId);
    if (!existingNote) {
      return jsonResponse(404, { message: "Note not found" });
    }

    // Build update expression dynamically based on what's being updated
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": new Date().toISOString(),
    };

    if (summary !== undefined) {
      updateExpressions.push("#summary = :summary");
      expressionAttributeNames["#summary"] = "summary";
      expressionAttributeValues[":summary"] = summary;
    }

    if (topic !== undefined) {
      updateExpressions.push("#topic = :topic");
      expressionAttributeNames["#topic"] = "topic";
      expressionAttributeValues[":topic"] = topic ?? null;
    }

    updateExpressions.push("updatedAt = :updatedAt");

    await docClient.send(
      new UpdateCommand({
        TableName: userNotesTableName,
        Key: {
          userId,
          noteId,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    return jsonResponse(200, {
      noteId,
      summary: summary ?? existingNote.summary ?? null,
      topic: topic ?? existingNote.topic ?? null,
    });
  } catch (error) {
    console.error("Failed to update note", error);
    return internalError("Failed to update note");
  }
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
