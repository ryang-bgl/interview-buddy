import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '../../shared/dynamodb';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { internalError, jsonResponse, unauthorized, notFound } from '../../shared/http';
import { UserDsaQuestionRecord } from '../../shared/types';

const userDsaTableName = process.env.USER_DSA_TABLE_NAME;

if (!userDsaTableName) {
  throw new Error('USER_DSA_TABLE_NAME env var must be set');
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
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

  const questionIndex = event.pathParameters?.questionIndex;
  if (!questionIndex) {
    return jsonResponse(400, { message: 'Missing questionIndex parameter' });
  }

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error('Authenticated user missing email identifier');
    return internalError();
  }

  const getCommand = new GetCommand({
    TableName: userDsaTableName,
    Key: {
      userId,
      questionIndex,
    },
  });

  try {
    const { Item } = await docClient.send(getCommand);

    if (!Item) {
      return notFound('Problem not found');
    }

    const record = Item as UserDsaQuestionRecord;

    return jsonResponse(200, {
      id: record.questionId,
      userId: record.userId,
      questionIndex: record.questionIndex ?? (record as unknown as { index?: string }).index,
      index: record.questionIndex ?? (record as unknown as { index?: string }).index,
      title: record.title,
      titleSlug: record.titleSlug,
      difficulty: record.difficulty,
      description: record.description,
      solution: record.solution ?? null,
      idealSolutionCode: record.idealSolutionCode ?? null,
      note: record.note ?? null,
      lastReviewedAt: record.lastReviewedAt ?? null,
      lastReviewStatus: record.lastReviewStatus ?? null,
      reviewIntervalSeconds: record.reviewIntervalSeconds ?? null,
      reviewEaseFactor: record.reviewEaseFactor ?? null,
      reviewRepetitions: record.reviewRepetitions ?? null,
      nextReviewDate: record.nextReviewDate ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error('Failed to get user question', error);
    return internalError();
  }
};
