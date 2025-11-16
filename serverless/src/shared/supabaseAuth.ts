import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";
import { UserRecord } from "./types";
import { docClient } from "./dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF;
const supabaseJwtAudience =
  process.env.SUPABASE_JWT_AUDIENCE ?? "authenticated";
const supabaseIssuer =
  process.env.SUPABASE_AUTH_URL ??
  (supabaseProjectRef
    ? `https://${supabaseProjectRef}.supabase.co/auth/v1`
    : undefined);
const jwksUrl =
  process.env.SUPABASE_JWKS_URL ??
  (supabaseProjectRef
    ? `https://${supabaseProjectRef}.supabase.co/auth/v1/.well-known/jwks.json`
    : undefined);

if (!supabaseProjectRef || !jwksUrl || !supabaseIssuer) {
  throw new Error(
    "SUPABASE_PROJECT_REF and SUPABASE_AUTH_URL/SUPABASE_JWKS_URL must be configured"
  );
}

const JWKS = createRemoteJWKSet(new URL(jwksUrl));

export class UnauthorizedError extends Error {}

export interface AuthenticatedUserContext {
  token: JWTPayload & { sub: string };
  user: UserRecord;
}

export async function authenticateRequest(
  event: APIGatewayProxyEventV2,
  explicitToken?: string | null
): Promise<AuthenticatedUserContext> {
  const idToken =
    explicitToken?.trim() ||
    extractBearerToken(event.headers ?? {}) ||
    extractTokenFromQuery(event.queryStringParameters ?? {});
  if (!idToken) {
    throw new UnauthorizedError("Missing Supabase session token");
  }

  const verified = await verifySupabaseToken(idToken);
  const user = await upsertUser(verified);
  return { token: verified, user };
}

async function verifySupabaseToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: supabaseIssuer,
      audience: supabaseJwtAudience,
    });

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedError("Token missing required claims");
    }

    return payload as JWTPayload & { sub: string; email: string };
  } catch (error) {
    console.error("Failed to verify Supabase token", error);
    throw new UnauthorizedError("Invalid Supabase token");
  }
}

async function upsertUser(
  payload: JWTPayload & { sub: string; email: string }
): Promise<UserRecord> {
  const now = new Date().toISOString();
  const command = new UpdateCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: { email: payload.email },
    UpdateExpression:
      "SET #id = if_not_exists(#id, :id), #lastUpdated = :lastUpdated, #createdDate = if_not_exists(#createdDate, :createdDate)",
    ExpressionAttributeNames: {
      "#id": "id",
      "#lastUpdated": "lastUpdatedDate",
      "#createdDate": "createdDate",
    },
    ExpressionAttributeValues: {
      ":id": payload.sub,
      ":lastUpdated": now,
      ":createdDate": now,
    },
    ReturnValues: "ALL_NEW",
  });

  const result = await docClient.send(command);
  if (!result.Attributes) {
    throw new UnauthorizedError("Unable to persist user");
  }

  return result.Attributes as UserRecord;
}

function extractBearerToken(
  headers: Record<string, string | undefined>
): string | null {
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value !== "string") continue;
    if (
      key.toLowerCase() === "authorization" &&
      value.toLowerCase().startsWith("bearer ")
    ) {
      return value.slice(7).trim();
    }
  }
  return null;
}

function extractTokenFromQuery(
  params: Record<string, string | undefined>
): string | null {
  for (const name of ["token", "access_token"]) {
    const value = params[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}
