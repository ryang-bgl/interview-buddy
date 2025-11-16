import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose';
import { UserRecord } from './types';
import { docClient } from './dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

const projectId = process.env.FIREBASE_PROJECT_ID;
const jwksUrl = new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
const JWKS = createRemoteJWKSet(jwksUrl);

if (!projectId) {
  throw new Error('FIREBASE_PROJECT_ID must be set');
}

export class UnauthorizedError extends Error {}

export interface AuthenticatedUserContext {
  token: JWTPayload & { user_id: string };
  user: UserRecord;
}

export async function authenticateRequest(
  event: APIGatewayProxyEventV2,
  explicitToken?: string | null,
): Promise<AuthenticatedUserContext> {
  const idToken = explicitToken?.trim() || extractBearerToken(event.headers ?? {}) || extractTokenFromQuery(event.queryStringParameters ?? {});
  if (!idToken) {
    throw new UnauthorizedError('Missing Firebase ID token');
  }

  const verified = await verifyFirebaseToken(idToken);
  const user = await upsertUser(verified);
  return { token: verified, user };
}

async function verifyFirebaseToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    if (!payload.user_id || !payload.email) {
      throw new UnauthorizedError('Token missing required claims');
    }

    return payload as JWTPayload & { user_id: string; email: string };
  } catch (error) {
    console.error('Failed to verify Firebase token', error);
    throw new UnauthorizedError('Invalid Firebase ID token');
  }
}

async function upsertUser(payload: JWTPayload & { user_id: string; email: string }): Promise<UserRecord> {
  const now = new Date().toISOString();
  const command = new UpdateCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: { email: payload.email },
    UpdateExpression:
      'SET #id = if_not_exists(#id, :id), #lastUpdated = :lastUpdated, #createdDate = if_not_exists(#createdDate, :createdDate)',
    ExpressionAttributeNames: {
      '#id': 'id',
      '#lastUpdated': 'lastUpdatedDate',
      '#createdDate': 'createdDate',
    },
    ExpressionAttributeValues: {
      ':id': payload.user_id,
      ':lastUpdated': now,
      ':createdDate': now,
    },
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(command);
  if (!result.Attributes) {
    throw new UnauthorizedError('Unable to persist user');
  }

  return result.Attributes as UserRecord;
}

function extractBearerToken(headers: Record<string, string | undefined>): string | null {
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value !== 'string') continue;
    if (key.toLowerCase() === 'authorization' && value.toLowerCase().startsWith('bearer ')) {
      return value.slice(7).trim();
    }
    if (key.toLowerCase() === 'x-firebase-token') {
      return value.trim();
    }
  }
  return null;
}

function extractTokenFromQuery(params: Record<string, string | undefined>): string | null {
  for (const name of ['idToken', 'token', 'firebaseIdToken']) {
    const value = params[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}
