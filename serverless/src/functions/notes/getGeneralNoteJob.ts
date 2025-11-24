import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
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
import type { UserNoteJobRecord } from "../../shared/types";

const jobsTableName = process.env.GENERAL_NOTE_JOBS_TABLE_NAME;

if (!jobsTableName) {
  throw new Error("GENERAL_NOTE_JOBS_TABLE_NAME env var must be set");
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

  const jobId = event.pathParameters?.jobId;
  if (!jobId) {
    return badRequest("jobId path parameter is required");
  }

  let job: UserNoteJobRecord | null = null;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: jobsTableName,
        Key: { jobId },
      })
    );
    job = (result.Item as UserNoteJobRecord | undefined) ?? null;
  } catch (error) {
    console.error("Failed to load general note job", error);
    return internalError();
  }

  if (!job || job.userId !== auth.user.email) {
    return jsonResponse(404, { message: "Job not found" });
  }

  return jsonResponse(200, {
    jobId: job.jobId,
    status: job.status,
    url: job.url,
    topic: job.topic ?? null,
    requirements: job.requirements ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    errorMessage: job.errorMessage ?? null,
    result:
      job.status === "completed"
        ? {
            noteId: job.resultNoteId ?? null,
            topic: job.resultTopic ?? job.topic ?? null,
            summary: job.resultSummary ?? null,
            cards: job.resultCards ?? [],
          }
        : undefined,
  });
};
