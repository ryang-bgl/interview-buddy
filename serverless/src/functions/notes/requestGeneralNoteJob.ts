import crypto from "node:crypto";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  badRequest,
  internalError,
  jsonResponse,
  unauthorized,
} from "../../shared/http";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";

const jobsTableName = process.env.GENERAL_NOTE_JOBS_TABLE_NAME;
const maxContentLength = Number(process.env.GENERAL_NOTE_MAX_CONTENT ?? 8000);

if (!jobsTableName) {
  throw new Error("GENERAL_NOTE_JOBS_TABLE_NAME env var must be set");
}

interface IncomingPayload {
  url: string;
  payload?: string;
  content?: string;
  topic?: string;
  requirements?: string;
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

  const normalizedUrl = normalizeUrl(payload.url);
  if (!normalizedUrl) {
    return badRequest("url must be a valid HTTP or HTTPS URL");
  }

  const normalizedPayload = sanitizeText(payload.payload ?? payload.content);
  if (!normalizedPayload) {
    return badRequest("payload is required");
  }

  const topic = optionalText(payload.topic);
  const requirements = optionalText(payload.requirements);

  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + 600;

  const jobItem = {
    jobId,
    userId,
    url: normalizedUrl,
    topic: topic ?? null,
    requirements: requirements ?? null,
    status: "pending",
    requestPayload: {
      content: normalizedPayload,
      topic: topic ?? null,
      requirements: requirements ?? null,
    },
    createdAt: now,
    updatedAt: now,
    expiresAt: expiresAtSeconds,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: jobsTableName,
        Item: jobItem,
      })
    );
  } catch (error) {
    console.error("Failed to persist general note job", error);
    return internalError();
  }

  return jsonResponse(202, { jobId });
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

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= maxContentLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxContentLength)}...`;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
