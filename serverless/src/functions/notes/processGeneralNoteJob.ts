import crypto from "node:crypto";
import { DynamoDBStreamHandler } from "aws-lambda";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../shared/dynamodb";
import type {
  UserNoteCardRecord,
  UserNoteJobRecord,
  UserNoteRecord,
} from "../../shared/types";

const jobsTableName = process.env.GENERAL_NOTE_JOBS_TABLE_NAME;
const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekApiUrl =
  process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/chat/completions";
const deepseekModel = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const DEEPSEEK_MAX_TOKENS = 8000;

if (!jobsTableName) {
  throw new Error("GENERAL_NOTE_JOBS_TABLE_NAME env var must be set");
}

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
}

if (!deepseekApiKey) {
  throw new Error("DEEPSEEK_API_KEY env var must be set");
}

interface StackResponse {
  topic: string;
  summary: string | null;
  cards: UserNoteCardRecord[];
}

interface ProcessorInput {
  jobId: string;
}

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records ?? []) {
    if (record.eventName !== "INSERT") {
      continue;
    }
    const jobId = record.dynamodb?.Keys?.jobId?.S;
    if (!jobId) {
      continue;
    }
    try {
      await processJob({ jobId });
    } catch (error) {
      console.error("[general-note-job] Failed to process job", {
        jobId,
        error,
      });
    }
  }
};

async function processJob({ jobId }: ProcessorInput) {
  const jobRecord = await loadJob(jobId);
  if (!jobRecord) {
    console.error("[general-note-job] Job not found", { jobId });
    return;
  }

  if (jobRecord.status !== "pending") {
    console.info("[general-note-job] Job already handled", {
      jobId,
      status: jobRecord.status,
    });
    return;
  }

  await updateJobStatus(jobId, "processing");

  try {
    const stack = await generateAnkiStack({
      url: jobRecord.url,
      content: jobRecord.requestPayload.content,
      topic: jobRecord.requestPayload.topic ?? jobRecord.topic ?? null,
      requirements:
        jobRecord.requestPayload.requirements ?? jobRecord.requirements ?? null,
    });

    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();
    const noteRecord: UserNoteRecord = {
      userId: jobRecord.userId,
      noteId,
      sourceUrl: jobRecord.url,
      topic: stack.topic,
      summary: stack.summary ?? undefined,
      requestPayload: {
        url: jobRecord.url,
        payload: jobRecord.requestPayload.content,
        topic: jobRecord.requestPayload.topic ?? null,
        requirements: jobRecord.requestPayload.requirements ?? null,
      },
      cards: stack.cards,
      createdAt: now,
      updatedAt: now,
      lastReviewedAt: null,
      lastReviewStatus: null,
      reviewIntervalSeconds: null,
      reviewEaseFactor: null,
      reviewRepetitions: null,
      nextReviewDate: null,
    };

    await docClient.send(
      new PutCommand({
        TableName: userNotesTableName,
        Item: noteRecord,
      })
    );

    await docClient.send(
      new UpdateCommand({
        TableName: jobsTableName,
        Key: { jobId },
        UpdateExpression:
          "SET #status = :status, resultNoteId = :noteId, resultTopic = :topic, resultSummary = :summary, resultCards = :cards, updatedAt = :updatedAt, errorMessage = :error",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "completed",
          ":noteId": noteId,
          ":topic": stack.topic,
          ":summary": stack.summary,
          ":cards": stack.cards,
          ":updatedAt": new Date().toISOString(),
          ":error": null,
        },
      })
    );
  } catch (error) {
    console.error("[general-note-job] Processor failed", error);
    await docClient.send(
      new UpdateCommand({
        TableName: jobsTableName,
        Key: { jobId },
        UpdateExpression:
          "SET #status = :status, errorMessage = :error, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "failed",
          ":error":
            error instanceof Error && error.message
              ? error.message
              : "Failed to generate review cards",
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  }
}

async function loadJob(jobId: string): Promise<UserNoteJobRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: jobsTableName,
      Key: { jobId },
    })
  );
  return (result.Item as UserNoteJobRecord | undefined) ?? null;
}

async function updateJobStatus(jobId: string, status: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: jobsTableName,
      Key: { jobId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

async function generateAnkiStack(input: {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
}): Promise<StackResponse> {
  const systemPrompt =
    "You are a tutor specialised to help the candidate pass technical interviews at companies like Facebook or Google. Interviews span system design and behavioural rounds. Your job is to analyse the provided material and craft the best plan for the candidate to master the knowledge.";

  const userPromptSegments = [
    `Analyze the content from url ${input.url}.`,
    input.topic ? `Treat the topic as: ${input.topic}.` : null,
    input.requirements
      ? `Respect these additional requirements: ${input.requirements}.`
      : null,
    "Turn the content into Anki-style stack cards so I can review them repeatedly.",
    "Do not be overly concise—cover every important insight from the provided material.",
    'Respond strictly in JSON using this structure: {"title": "Meaningful title", "tags": ["SystemDesign"], "cards": [{"front": "question", "back": "detailed answer", "extra"?: "tips"}]}.',
    'Each tag in the payload must be one of the following enum values: "SystemDesign", "Behaviour", "Algo", "Other".',
    "Don't add ```json\n",
    "Here is the raw content, bounded by triple quotes:",
    '"""',
    input.content,
    '"""',
  ].filter(Boolean);

  const userPrompt = userPromptSegments.join("\n");

  const response = await fetch(deepseekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: DEEPSEEK_MAX_TOKENS,
    }),
  });

  const body = await safeReadJson(response);
  if (!response.ok) {
    console.error("DeepSeek API error", response.status, body);
    throw new Error("DeepSeek generation failed");
  }

  const aiContent = body?.choices?.[0]?.message?.content;
  if (typeof aiContent !== "string") {
    throw new Error("DeepSeek response missing content");
  }

  return parseStackPayload(aiContent, input.topic);
}

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse DeepSeek JSON response", error);
    return null;
  }
}

function parseStackPayload(
  raw: string,
  fallbackTopic: string | null
): StackResponse {
  const unwrapped = (() => {
    const trimmed = raw.trim();
    if (
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  })();

  const cleaned = unwrapped.replace(/```json|```/gi, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("Unable to parse DeepSeek payload", { raw });
    throw error;
  }

  const topic =
    optionalText(parsed?.title) ?? fallbackTopic ?? "Interview study stack";
  const cardsInput: unknown[] = Array.isArray(parsed?.cards)
    ? parsed.cards
    : [];
  const cards: UserNoteCardRecord[] = cardsInput
    .map((card: any, index: number) => normalizeCard(card, index))
    .filter((card): card is UserNoteCardRecord => Boolean(card));

  if (cards.length === 0) {
    throw new Error("DeepSeek response did not contain any cards");
  }

  return { topic, summary: null, cards };
}

function normalizeCard(card: any, index: number): UserNoteCardRecord | null {
  const front = optionalText(card?.front);
  const back = optionalText(card?.back);
  if (!front || !back) {
    return null;
  }

  const extra = optionalText(card?.extra);
  const tags = Array.isArray(card?.tags)
    ? card.tags
        .map((tag: unknown) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag: string) => Boolean(tag))
    : undefined;

  return {
    id: optionalText(card?.id) ?? `card-${index + 1}`,
    front,
    back,
    extra: extra ?? undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
  };
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
