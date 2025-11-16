import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { jsonResponse, unauthorized } from '../../shared/http';
import { UserRecord } from '../../shared/types';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const auth = await authenticateRequest(event);
    return jsonResponse(200, mapUser(auth.user));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message);
    }
    console.error('Failed to resolve current principal', error);
    return unauthorized('No authenticated principal available');
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
