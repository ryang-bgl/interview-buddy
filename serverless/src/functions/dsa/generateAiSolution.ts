import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import {
  authenticateRequest,
  UnauthorizedError,
} from "../../shared/supabaseAuth";
import {
  badRequest,
  internalError,
  jsonResponse,
  unauthorized,
} from "../../shared/http";
import type {
  AiSolutionRecord,
  UserDsaQuestionRecord,
} from "../../shared/types";

const userDsaTableName = process.env.USER_DSA_TABLE_NAME;
const aiSolutionTableName = process.env.AI_SOLUTION_TABLE_NAME;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekApiUrl =
  process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/chat/completions";
const deepseekModel = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

if (!userDsaTableName || !aiSolutionTableName) {
  throw new Error("USER_DSA_TABLE_NAME and AI_SOLUTION_TABLE_NAME must be set");
}

if (!deepseekApiKey) {
  throw new Error("DEEPSEEK_API_KEY must be set");
}

interface IncomingPayload {
  questionIndex?: string;
  model?: string;
  language?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let auth;
  try {
    auth = await authenticateRequest(event);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message);
    }
    console.error("Unexpected authentication error", error);
    return internalError();
  }

  const userId = auth.user.email?.trim();
  if (!userId) {
    console.error("Authenticated user missing email identifier");
    return internalError();
  }

  let payload: IncomingPayload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Body must be valid JSON");
  }

  const questionIndex = normalizeText(payload.questionIndex);
  if (!questionIndex) {
    return badRequest("questionIndex is required");
  }

  const model = normalizeText(payload.model) ?? deepseekModel;
  const language = normalizeText(payload.language);

  let cached: AiSolutionRecord | null = null;
  try {
    cached = await loadCachedSolution({
      questionIndex,
      language,
    });
  } catch (error) {
    console.error("Failed to load cached AI solution", error);
  }

  if (cached) {
    return jsonResponse(200, {
      questionIndex,
      answer: cached.answer,
      cached: true,
    });
  }

  let generated: string;
  try {
    generated = await callDeepseek({ questionIndex, language });
  } catch (error) {
    console.error("Failed to call DeepSeek", error);
    return internalError();
  }

  const languageKey = language ?? "default";
  const record: AiSolutionRecord = {
    id: `${questionIndex}#${model}#${languageKey}`,
    questionIndex,
    model,
    language: languageKey,
    answer: generated,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: aiSolutionTableName,
        Item: record,
      })
    );
  } catch (error) {
    console.warn("Failed to persist AI solution cache", error);
  }

  return jsonResponse(200, {
    questionIndex,
    answer: generated,
    cached: false,
  });
};

function normalizeText(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function loadQuestion(
  userId: string,
  questionIndex: string
): Promise<UserDsaQuestionRecord | null> {
  const command = new GetCommand({
    TableName: userDsaTableName,
    Key: { userId, questionIndex },
  });
  const result = await docClient.send(command);
  return (result.Item as UserDsaQuestionRecord | undefined) ?? null;
}

async function loadCachedSolution({
  questionIndex,
  language,
}: {
  questionIndex: string;
  language?: string | null;
}): Promise<AiSolutionRecord | null> {
  const languageKey = language ?? "default";
  const command = new GetCommand({
    TableName: aiSolutionTableName,
    Key: { questionIndex, language: languageKey },
  });
  const result = await docClient.send(command);
  return (result.Item as AiSolutionRecord | undefined) ?? null;
}

async function callDeepseek({
  questionIndex,
  language,
}: {
  questionIndex: string;
  language?: string | null;
}): Promise<string> {
  const prompt = `You are helping a candidate prepare for coding interviews. Given the following LeetCode problem ${questionIndex}, craft a clean, well-commented solution including time and space complexity.\n\nReturn only the correct and optimal solution and brief explanation.`;
  const deepseekModel = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const response = await fetch(deepseekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: [
        {
          role: "system",
          content: `You are an expert coding interviewer writing high-quality ${
            language || "programming"
          } solutions.`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("DeepSeek error", response.status, errorBody);
    throw new Error("Failed to generate AI solution");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("DeepSeek returned no solution");
  }

  return answer;
}
