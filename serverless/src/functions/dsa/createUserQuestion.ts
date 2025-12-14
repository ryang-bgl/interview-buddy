import crypto from 'node:crypto';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../shared/dynamodb';
import { badRequest, internalError, jsonResponse, unauthorized } from '../../shared/http';
import { UserDsaQuestionRecord } from '../../shared/types';
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth';
import { getAllDsaQuestions } from '../../shared/dsaQuestions';

const userDsaTableName = process.env.USER_DSA_TABLE_NAME;

if (!userDsaTableName) {
  throw new Error('USER_DSA_TABLE_NAME env var must be set');
}

const requiredFields = ['title', 'titleSlug', 'difficulty', 'description'];

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

  const body = decodeBody(event.body, event.isBase64Encoded);
  if (!body) {
    return badRequest('Request body is required');
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return badRequest('Body must be valid JSON');
  }

  const missingFields = requiredFields.filter((field) => !hasText(payload[field]));
  if (missingFields.length > 0) {
    return badRequest(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error('Authenticated user missing email identifier');
    return internalError();
  }

  const questionIndex = normalizeQuestionIndex(payload.questionIndex ?? payload.index);
  if (!questionIndex) {
    return badRequest('questionIndex must be provided');
  }

  let existingQuestion: UserDsaQuestionRecord | null = null;
  try {
    existingQuestion = await getExistingQuestion(userId, questionIndex);
  } catch (error) {
    console.error('Failed to load existing question', error);
    return internalError();
  }

  const now = new Date().toISOString();
  const questionId =
    (payload.id as string) ||
    (payload.questionId as string) ||
    existingQuestion?.questionId ||
    crypto.randomUUID();
  const createdAt = existingQuestion?.createdAt ?? now;

  const normalizedIdealSolution =
    typeof payload.idealSolutionCode === 'string'
      ? payload.idealSolutionCode.trim()
      : '';
  const shouldUpdateIdealSolution = normalizedIdealSolution.length > 1;
  const idealSolutionValue = shouldUpdateIdealSolution
    ? normalizedIdealSolution
    : existingQuestion?.idealSolutionCode ?? null;

  const normalizedNote =
    typeof payload.note === 'string' ? payload.note.trim() : '';
  const shouldUpdateNote = normalizedNote.length > 1;
  const noteValue = shouldUpdateNote ? normalizedNote : existingQuestion?.note ?? null;

  const command = new UpdateCommand({
    TableName: userDsaTableName,
    Key: {
      userId,
      questionIndex,
    },
    UpdateExpression:
      'SET #title = :title, titleSlug = :titleSlug, difficulty = :difficulty, description = :description, solution = :solution, idealSolutionCode = :idealSolutionCode, #note = :note, updatedAt = :updatedAt, questionId = :questionId, createdAt = :createdAt',
    ExpressionAttributeValues: {
      ':title': String(payload.title).trim(),
      ':titleSlug': String(payload.titleSlug).trim(),
      ':difficulty': String(payload.difficulty).trim(),
      ':description': String(payload.description).trim(),
      ':solution': stringifyOptional(payload.solution),
      ':idealSolutionCode': idealSolutionValue,
      ':note': noteValue,
      ':updatedAt': now,
      ':createdAt': createdAt,
      ':questionId': questionId,
    },
    ExpressionAttributeNames: {
      '#title': 'title',
      '#note': 'note',
    },
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
    const statusCode = existingQuestion ? 200 : 201;
    return jsonResponse(statusCode, mapQuestion(Attributes as UserDsaQuestionRecord, questionMap));
  } catch (error) {
    console.error('Failed to persist user question', error);
    return internalError();
  }
};

async function getExistingQuestion(userId: string, questionIndex: string): Promise<UserDsaQuestionRecord | null> {
  const getCommand = new GetCommand({
    TableName: userDsaTableName,
    Key: { userId, questionIndex },
  });
  const { Item } = await docClient.send(getCommand);
  return Item ? (Item as UserDsaQuestionRecord) : null;
}

function stringifyOptional(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
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

function normalizeQuestionIndex(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
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
