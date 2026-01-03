import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";
import type { UserNoteRecord } from "./types";

export interface FindNoteByUrlOptions {
  tableName: string;
  userId: string;
  url: string;
  projection?: string;
}

/**
 * Find a note by its source URL.
 * Returns the first matching note or null if not found.
 */
export async function findNoteByUrl(
  options: FindNoteByUrlOptions
): Promise<UserNoteRecord | null> {
  const { tableName, userId, url, projection } = options;

  const queryInput: any = {
    TableName: tableName,
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "sourceUrl = :sourceUrl",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":sourceUrl": url,
    },
    Limit: 1,
  };

  if (projection) {
    queryInput.ProjectionExpression = projection;
  }

  const query = new QueryCommand(queryInput);

  try {
    const result = await docClient.send(query);
    const items = (result.Items as UserNoteRecord[] | undefined) ?? [];
    return items[0] ?? null;
  } catch (error) {
    console.error("[findNoteByUrl] Failed to query note by URL", {
      userId,
      url,
      error,
    });
    throw error;
  }
}

/**
 * Find a note by its ID.
 * Returns the note or null if not found.
 */
export async function findNoteById(
  tableName: string,
  userId: string,
  noteId: string
): Promise<UserNoteRecord | null> {
  const { GetCommand } = await import("@aws-sdk/lib-dynamodb");

  const command = new GetCommand({
    TableName: tableName,
    Key: {
      userId,
      noteId,
    },
  });

  try {
    const result = await docClient.send(command);
    return (result.Item as UserNoteRecord | undefined) ?? null;
  } catch (error) {
    console.error("[findNoteById] Failed to load note by ID", {
      userId,
      noteId,
      error,
    });
    throw error;
  }
}
