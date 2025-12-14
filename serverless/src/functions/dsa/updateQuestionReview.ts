import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '../../shared/dynamodb';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { badRequest, internalError, jsonResponse, unauthorized } from '../../shared/http';
import { UserDsaQuestionRecord } from '../../shared/types';
import { getAllDsaQuestions } from '../../shared/dsaQuestions';

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
  if (!payload?.lastReviewedAt || !payload?.nextReviewDate) {
    return badRequest('lastReviewedAt and nextReviewDate are required');
  }

  const command = new UpdateCommand({
    TableName: userDsaTableName,
    Key: { userId, questionIndex },
    UpdateExpression:
      'SET lastReviewedAt = :lastReviewedAt, lastReviewStatus = :lastReviewStatus, reviewIntervalSeconds = :reviewIntervalSeconds, reviewEaseFactor = :reviewEaseFactor, reviewRepetitions = :reviewRepetitions, nextReviewDate = :nextReviewDate, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':lastReviewedAt': payload.lastReviewedAt,
      ':lastReviewStatus': payload.lastReviewStatus ?? null,
      ':reviewIntervalSeconds': payload.reviewIntervalSeconds ?? null,
      ':reviewEaseFactor': payload.reviewEaseFactor ?? null,
      ':reviewRepetitions': payload.reviewRepetitions ?? null,
      ':nextReviewDate': payload.nextReviewDate,
      ':updatedAt': new Date().toISOString(),
    },
    ConditionExpression: 'attribute_exists(questionIndex)',
    ReturnValues: 'ALL_NEW',
  });

  // Load all DSA questions to use as fallback for difficulty
  const allDsaQuestions = getAllDsaQuestions();
  const questionMap = new Map<number, any>();
  allDsaQuestions.forEach(q => {
    questionMap.set(q.index, q);
  });

  try {
    const { Attributes } = await docClient.send(command);
    if (!Attributes) {
      return internalError();
    }
    return jsonResponse(200, mapQuestion(Attributes as UserDsaQuestionRecord, questionMap));
  } catch (error: any) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return badRequest('Question not found');
    }
    console.error('Failed to update question review metadata', error);
    return internalError();
  }
};

interface ReviewPayload {
  lastReviewedAt: string
  nextReviewDate: string
  lastReviewStatus?: string
  reviewIntervalSeconds?: number | null
  reviewEaseFactor?: number | null
  reviewRepetitions?: number | null
}

function parsePayload(body: string | undefined, isBase64?: boolean): ReviewPayload | null {
  if (!body) {
    return null;
  }
  const decoded = isBase64 ? Buffer.from(body, 'base64').toString('utf-8') : body;
  try {
    const payload = JSON.parse(decoded);
    const lastReviewedValue = payload.lastReviewedAt ?? payload.reviewedAt;
    const nextReviewValue = payload.nextReviewDate ?? payload.dueAt;
    if (!lastReviewedValue || !nextReviewValue) {
      return null;
    }
    const lastReviewed = new Date(lastReviewedValue);
    const nextReview = new Date(nextReviewValue);
    if (Number.isNaN(lastReviewed.getTime()) || Number.isNaN(nextReview.getTime())) {
      return null;
    }
    const status = typeof payload.lastReviewStatus === 'string' ? payload.lastReviewStatus : undefined;
    return {
      lastReviewedAt: lastReviewed.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      lastReviewStatus: status,
      reviewIntervalSeconds: parseNumeric(payload.reviewIntervalSeconds),
      reviewEaseFactor: parseNumeric(payload.reviewEaseFactor),
      reviewRepetitions: parseNumeric(payload.reviewRepetitions),
    };
  } catch {
    return null;
  }
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function mapQuestion(record: UserDsaQuestionRecord, questionMap: Map<number, any>) {
  const questionIndex = record.questionIndex ?? (record as unknown as { index?: string }).index;
  const questionIndexNum = parseInt(questionIndex, 10);

  // Get additional data from the CSV
  const csvQuestion = questionMap.get(questionIndexNum);

  // Use saved difficulty, but fallback to CSV data if it's "Unknown" or missing
  const difficulty = record.difficulty === 'Unknown' || !record.difficulty
    ? csvQuestion?.difficulty || 'Unknown'
    : record.difficulty;

  return {
    id: record.questionId,
    userId: record.userId,
    questionIndex,
    index: questionIndex,
    title: record.title,
    titleSlug: record.titleSlug,
    difficulty: difficulty,
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
