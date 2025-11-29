import crypto from 'node:crypto'
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { PutCommand } from '@aws-sdk/lib-dynamodb'

import { docClient } from '../../shared/dynamodb'
import { authenticateRequest, UnauthorizedError } from '../../shared/supabaseAuth'
import { badRequest, internalError, jsonResponse, unauthorized } from '../../shared/http'

const feedbackTableName = process.env.USER_FEEDBACK_TABLE_NAME

if (!feedbackTableName) {
  throw new Error('USER_FEEDBACK_TABLE_NAME env var must be set')
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let auth
  try {
    auth = await authenticateRequest(event)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message)
    }
    console.error('Unexpected authentication error', error)
    return internalError()
  }

  const userId = auth.user.email?.trim()
  if (!userId) {
    console.error('Authenticated user missing email identifier')
    return internalError()
  }

  const payload = parsePayload(event.body, event.isBase64Encoded)
  if (!payload) {
    return badRequest('Invalid feedback payload')
  }

  const message = payload.message?.trim()
  if (!message || message.length < 3) {
    return badRequest('message must be at least 3 characters long')
  }

  const now = new Date().toISOString()
  const item = {
    userId,
    feedbackId: crypto.randomUUID(),
    message,
    pageUrl: payload.pageUrl ?? null,
    category: payload.category ?? null,
    createdAt: now,
    updatedAt: now,
  }

  const command = new PutCommand({
    TableName: feedbackTableName,
    Item: item,
  })

  try {
    await docClient.send(command)
    return jsonResponse(201, { feedbackId: item.feedbackId })
  } catch (error) {
    console.error('Failed to persist feedback', error)
    return internalError()
  }
}

interface FeedbackPayload {
  message?: string
  pageUrl?: string | null
  category?: string | null
}

function parsePayload(body: string | undefined, isBase64?: boolean): FeedbackPayload | null {
  if (!body) {
    return null
  }
  const decoded = isBase64 ? Buffer.from(body, 'base64').toString('utf-8') : body
  try {
    const payload = JSON.parse(decoded)
    if (!payload || typeof payload !== 'object') {
      return null
    }
    return {
      message: typeof payload.message === 'string' ? payload.message : undefined,
      pageUrl: typeof payload.pageUrl === 'string' ? payload.pageUrl : null,
      category: typeof payload.category === 'string' ? payload.category : null,
    }
  } catch (error) {
    console.warn('Failed to parse feedback payload', error)
    return null
  }
}
