import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export function jsonResponse(
  statusCode: number,
  payload: Record<string, unknown> | Array<unknown> | string | number | boolean | null,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(payload ?? null),
  };
}

export function badRequest(message: string): APIGatewayProxyStructuredResultV2 {
  return jsonResponse(400, { message });
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyStructuredResultV2 {
  return jsonResponse(401, { message });
}

export function internalError(): APIGatewayProxyStructuredResultV2 {
  return jsonResponse(500, { message: 'Internal server error' });
}
