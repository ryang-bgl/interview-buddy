import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { getFirebaseApp } from './firebase';
import { upsertUserFromFirebaseToken } from './userStore';
import { UserRecord } from './types';

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export interface AuthenticatedUserContext {
  token: DecodedIdToken;
  user: UserRecord;
}

export async function authenticateRequest(
  event: APIGatewayProxyEventV2,
  explicitToken?: string | null,
): Promise<AuthenticatedUserContext> {
  const idToken =
    (explicitToken && explicitToken.trim()) ??
    extractBearerToken(event.headers ?? {}) ??
    extractTokenFromQuery(event.queryStringParameters ?? {});

  if (!idToken) {
    throw new UnauthorizedError('Missing Firebase ID token');
  }

  try {
    const firebaseApp = await getFirebaseApp();
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
    const user = await upsertUserFromFirebaseToken(decodedToken);
    return { token: decodedToken, user };
  } catch (error) {
    console.error('Failed to verify Firebase ID token', error);
    throw new UnauthorizedError('Invalid Firebase ID token');
  }
}

function extractBearerToken(headers: Record<string, string | undefined>): string | null {
  const normalizedHeaders = Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key.toLowerCase()] = value.trim();
    }
    return acc;
  }, {});

  const authorization = normalizedHeaders['authorization'];
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  const firebaseHeader = normalizedHeaders['x-firebase-token'] || normalizedHeaders['x-id-token'];
  if (firebaseHeader) {
    return firebaseHeader;
  }

  return null;
}

function extractTokenFromQuery(params: Record<string, string | undefined>): string | null {
  const candidates = ['idToken', 'token', 'firebaseIdToken'];
  for (const candidate of candidates) {
    const value = params[candidate];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}
