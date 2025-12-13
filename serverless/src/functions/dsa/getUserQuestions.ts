import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '../../shared/dynamodb';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { internalError, jsonResponse, unauthorized } from '../../shared/http';
import { UserDsaQuestionRecord } from '../../shared/types';
import { getAllDsaQuestions } from '../../shared/dsaQuestions';

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
    const allDsaQuestions = getAllDsaQuestions(); // Now synchronous

    // Create a map of question index to question data
    const questionMap = new Map<number, any>();
    allDsaQuestions.forEach(q => {
      questionMap.set(q.index, q);
    });

    const questions = (Items ?? []).map((record) =>
      mapQuestion(record as UserDsaQuestionRecord, questionMap)
    );
    return jsonResponse(200, questions);
  } catch (error) {
    console.error('Failed to query user questions', error);
    return internalError();
  }
};

function mapQuestion(record: UserDsaQuestionRecord, questionMap: Map<number, any>) {
  const questionIndex = record.questionIndex ?? (record as unknown as { index?: string }).index;
  const questionIndexNum = parseInt(questionIndex, 10);

  // Get additional data from the CSV
  const csvQuestion = questionMap.get(questionIndexNum);

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
    reviewIntervalSeconds: record.reviewIntervalSeconds ?? null,
    reviewEaseFactor: record.reviewEaseFactor ?? null,
    reviewRepetitions: record.reviewRepetitions ?? null,
    nextReviewDate: record.nextReviewDate ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    // Add fields from CSV
    tags: csvQuestion?.tags || [],
    relatedQuestions: csvQuestion?.relatedQuestions || []
  };
}
