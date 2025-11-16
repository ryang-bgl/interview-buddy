import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { badRequest, jsonResponse, unauthorized } from '../../shared/http';
import { UserRecord } from '../../shared/types';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const bodyString = decodeBody(event.body, event.isBase64Encoded);
  let payload: Record<string, unknown> | null = null;

  if (bodyString) {
    try {
      payload = JSON.parse(bodyString);
    } catch {
      return badRequest('Body must be valid JSON');
    }
  }

  const explicitToken = extractTokenFromPayload(payload);

  try {
    const auth = await authenticateRequest(event, explicitToken ?? undefined);
    return jsonResponse(200, {
      user: mapUser(auth.user),
      firebaseToken: {
        uid: auth.token.uid,
        emailVerified: auth.token.email_verified ?? false,
        issuer: auth.token.iss,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message);
    }
    console.error('Unexpected Firebase authentication error', error);
    return unauthorized('Unable to authenticate request');
  }
};

function mapUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    leetstackUsername: user.leetstackUsername ?? null,
    createdDate: user.createdDate ?? null,
    lastUpdatedDate: user.lastUpdatedDate ?? null,
  };
}

function decodeBody(body: string | undefined, isBase64Encoded?: boolean): string | null {
  if (!body) {
    return null;
  }
  if (isBase64Encoded) {
    return Buffer.from(body, 'base64').toString('utf-8');
  }
  return body;
}

function extractTokenFromPayload(payload: Record<string, unknown> | null): string | null {
  if (!payload) {
    return null;
  }

  const candidates = ['idToken', 'token', 'firebaseIdToken'];
  for (const candidate of candidates) {
    const value = payload[candidate];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
