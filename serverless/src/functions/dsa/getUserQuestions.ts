import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '../../shared/dynamodb';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { internalError, jsonResponse, unauthorized } from '../../shared/http';
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

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error('Authenticated user missing email identifier');
    return internalError();
  }

  const queryCommand = new QueryCommand({
    TableName: userDsaTableName,
    KeyConditionExpression: '#userId = :userId',
    ExpressionAttributeNames: {
      '#userId': 'userId',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: true,
  });

  try {
    const { Items } = await docClient.send(queryCommand);
    const questions = (Items ?? []).map((record) =>
      mapQuestion(record as UserDsaQuestionRecord)
    );
    return jsonResponse(200, questions);
  } catch (error) {
    console.error('Failed to query user questions', error);
    return internalError();
  }
};

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
