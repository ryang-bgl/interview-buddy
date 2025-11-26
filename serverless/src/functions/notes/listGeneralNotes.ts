import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";
import {
  internalError,
  jsonResponse,
  unauthorized,
} from "../../shared/http";
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
  cardCount: number;
  tags: string[];
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
        "noteId, sourceUrl, topic, summary, cards, createdAt, lastReviewedAt, lastReviewStatus",
    });
    const result = await docClient.send(query);
    const items = (result.Items as UserNoteRecord[] | undefined) ?? [];

    const summaries: NoteSummary[] = items
      .map((note) => mapToSummary(note))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return jsonResponse(200, { notes: summaries });
  } catch (error) {
    console.error("Failed to list general notes", error);
    return internalError();
  }
};

function mapToSummary(note: UserNoteRecord): NoteSummary {
  const tags = new Set<string>();
  (note.cards ?? []).forEach((card) => {
    card?.tags?.forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed) {
        tags.add(trimmed);
      }
    });
  });

  return {
    noteId: note.noteId,
    url: note.sourceUrl,
    topic: note.topic ?? null,
    summary: note.summary ?? null,
    createdAt: note.createdAt,
    lastReviewedAt: note.lastReviewedAt ?? null,
    lastReviewStatus: note.lastReviewStatus ?? null,
    cardCount: note.cards?.length ?? 0,
    tags: Array.from(tags),
  };
}
