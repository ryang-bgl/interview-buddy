import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DecodedIdToken } from 'firebase-admin/auth';
import { docClient } from './dynamodb';
import { UserRecord } from './types';

const usersTableName = process.env.USERS_TABLE_NAME;
const usersTableIdIndexName = process.env.USERS_TABLE_ID_INDEX_NAME;

if (!usersTableName) {
  throw new Error('USERS_TABLE_NAME env var must be set');
}

if (!usersTableIdIndexName) {
  throw new Error('USERS_TABLE_ID_INDEX_NAME env var must be set');
}

export async function upsertUserFromFirebaseToken(token: DecodedIdToken): Promise<UserRecord> {
  if (!token.email) {
    throw new Error('Firebase token is missing email claim');
  }

  const now = new Date().toISOString();

  const expressionParts = [
    '#id = if_not_exists(#id, :id)',
    '#lastUpdatedDate = :lastUpdatedDate',
    '#createdDate = if_not_exists(#createdDate, :createdDate)',
  ];

  const expressionAttributeNames: Record<string, string> = {
    '#id': 'id',
    '#lastUpdatedDate': 'lastUpdatedDate',
    '#createdDate': 'createdDate',
  };

  const expressionAttributeValues: Record<string, unknown> = {
    ':id': token.uid,
    ':lastUpdatedDate': now,
    ':createdDate': now,
  };

  if (token.name) {
    const [firstName, ...rest] = token.name.split(' ');
    if (firstName) {
      expressionParts.push('#firstName = :firstName');
      expressionAttributeNames['#firstName'] = 'firstName';
      expressionAttributeValues[':firstName'] = firstName;
    }

    const lastName = rest.join(' ').trim();
    if (lastName) {
      expressionParts.push('#lastName = :lastName');
      expressionAttributeNames['#lastName'] = 'lastName';
      expressionAttributeValues[':lastName'] = lastName;
    }
  }

  const updateExpression = `SET ${expressionParts.join(', ')}`;

  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: usersTableName,
    Key: { email: token.email },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  if (!Attributes) {
    throw new Error('Failed to upsert user record');
  }

  return Attributes as UserRecord;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName: usersTableName,
      IndexName: usersTableIdIndexName,
      KeyConditionExpression: '#id = :userId',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: 1,
    }),
  );

  if (!Items || Items.length === 0) {
    return null;
  }

  return Items[0] as UserRecord;
}
