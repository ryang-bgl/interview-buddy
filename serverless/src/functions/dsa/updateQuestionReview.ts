import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '../../shared/dynamodb';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { badRequest, internalError, jsonResponse, unauthorized } from '../../shared/http';
import { UserDsaQuestionRecord } from '../../shared/types';

const userDsaTableName = process.env.USER_DSA_TABLE_NAME;

if (!userDsaTableName) {
  throw new Error('USER_DSA_TABLE_NAME env var must be set');
}

export const handler: APIGatewayProxyHandlerV2 = async event => {
  let auth;
  try {
    auth = await authenticateRequest(event);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message);
    }
    console.error('Unexpected authentication error', error);
    return internalError();
  }

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error('Authenticated user missing email identifier');
    return internalError();
  }

  const questionIndex = event.pathParameters?.questionIndex?.trim();
  if (!questionIndex) {
    return badRequest('questionIndex path parameter is required');
  }

  const payload = parsePayload(event.body, event.isBase64Encoded);
  if (!payload?.lastReviewedAt) {
    return badRequest('A valid lastReviewedAt value is required');
  }

  const command = new UpdateCommand({
    TableName: userDsaTableName,
    Key: { userId, questionIndex },
    UpdateExpression: 'SET lastReviewedAt = :lastReviewedAt, lastReviewStatus = :lastReviewStatus, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':lastReviewedAt': payload.lastReviewedAt,
      ':lastReviewStatus': payload.lastReviewStatus ?? null,
      ':updatedAt': new Date().toISOString(),
    },
    ConditionExpression: 'attribute_exists(questionIndex)',
    ReturnValues: 'ALL_NEW',
  });

  try {
    const { Attributes } = await docClient.send(command);
    if (!Attributes) {
      return internalError();
    }
    return jsonResponse(200, mapQuestion(Attributes as UserDsaQuestionRecord));
  } catch (error: any) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return badRequest('Question not found');
    }
    console.error('Failed to update question review metadata', error);
    return internalError();
  }
};

function parsePayload(body: string | undefined, isBase64?: boolean) {
  if (!body) {
    return null;
  }
  const decoded = isBase64 ? Buffer.from(body, 'base64').toString('utf-8') : body;
  try {
    const payload = JSON.parse(decoded);
    const value = payload.lastReviewedAt ?? payload.reviewedAt;
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const status = typeof payload.lastReviewStatus === 'string' ? payload.lastReviewStatus : undefined;
    return {
      lastReviewedAt: date.toISOString(),
      lastReviewStatus: status,
    };
  } catch {
    return null;
  }
}

function mapQuestion(record: UserDsaQuestionRecord) {
  const questionIndex = record.questionIndex ?? (record as unknown as { index?: string }).index;
  return {
    id: record.questionId,
    userId: record.userId,
    questionIndex,
    index: questionIndex,
    title: record.title,
    titleSlug: record.titleSlug,
    difficulty: record.difficulty,
    description: record.description,
    solution: record.solution ?? null,
    idealSolutionCode: record.idealSolutionCode ?? null,
    note: record.note ?? null,
    lastReviewedAt: record.lastReviewedAt ?? null,
    lastReviewStatus: record.lastReviewStatus ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
