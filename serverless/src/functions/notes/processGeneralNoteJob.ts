import crypto from "node:crypto";
import { DynamoDBStreamHandler } from "aws-lambda";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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

interface FlashcardAnchor {
  front: string;
  back: string;
  extra?: string | null;
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
    const existingNote = await findExistingNote(
      jobRecord.userId,
      jobRecord.url
    );
    const existingAnchor = buildAnchorFromCard(
      existingNote?.cards?.[existingNote.cards.length - 1]
    );
    const stack = await generateCompleteStack({
      url: jobRecord.url,
      content: jobRecord.requestPayload.content,
      topic: jobRecord.requestPayload.topic ?? jobRecord.topic ?? null,
      requirements:
        jobRecord.requestPayload.requirements ?? jobRecord.requirements ?? null,
      initialAnchor: existingAnchor,
    });
    const newCardsCount = stack.cards.length;
    const now = new Date().toISOString();
    let noteId = existingNote?.noteId ?? crypto.randomUUID();
    let totalCards = stack.cards.length;
    let responseTopic = stack.topic;
    let responseSummary = stack.summary ?? null;
    let createdAt = now;
    let lastReviewedAt: string | null = null;
    let lastReviewStatus: string | null = null;
    let reviewIntervalSeconds: number | null = null;
    let reviewEaseFactor: number | null = null;
    let reviewRepetitions: number | null = null;
    let nextReviewDate: string | null = null;

    if (existingNote) {
      noteId = existingNote.noteId;
      const existingCards = existingNote.cards ?? [];
      const updatedCards =
        newCardsCount > 0 ? [...existingCards, ...stack.cards] : existingCards;
      totalCards = updatedCards.length;
      responseTopic = existingNote.topic ?? stack.topic;
      responseSummary = existingNote.summary ?? stack.summary ?? null;
      createdAt = existingNote.createdAt;
      lastReviewedAt = existingNote.lastReviewedAt ?? null;
      lastReviewStatus = existingNote.lastReviewStatus ?? null;
      reviewIntervalSeconds = existingNote.reviewIntervalSeconds ?? null;
      reviewEaseFactor = existingNote.reviewEaseFactor ?? null;
      reviewRepetitions = existingNote.reviewRepetitions ?? null;
      nextReviewDate = existingNote.nextReviewDate ?? null;

      if (newCardsCount > 0) {
        const updateParts = ["cards = :cards", "updatedAt = :updatedAt"];
        const names: Record<string, string> = {};
        const values: Record<string, unknown> = {
          ":cards": updatedCards,
          ":updatedAt": now,
        };
        if (responseSummary) {
          updateParts.push("#summary = :summary");
          names["#summary"] = "summary";
          values[":summary"] = responseSummary;
        }
        try {
          await docClient.send(
            new UpdateCommand({
              TableName: userNotesTableName,
              Key: { userId: jobRecord.userId, noteId: existingNote.noteId },
              UpdateExpression: `SET ${updateParts.join(", ")}`,
              ExpressionAttributeNames:
                Object.keys(names).length > 0 ? names : undefined,
              ExpressionAttributeValues: values,
            })
          );
        } catch (error) {
          console.error("Failed to append cards to existing note", error);
          throw error;
        }
      }
    } else {
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
        reviewIntervalSeconds: undefined,
        reviewEaseFactor: undefined,
        reviewRepetitions: undefined,
        nextReviewDate: null,
      };

      await docClient.send(
        new PutCommand({
          TableName: userNotesTableName,
          Item: noteRecord,
        })
      );
    }

    await docClient.send(
      new UpdateCommand({
        TableName: jobsTableName,
        Key: { jobId },
        UpdateExpression:
          "SET #status = :status, resultNoteId = :noteId, resultTopic = :topic, resultSummary = :summary, resultCards = :cards, resultNewCards = :newCards, updatedAt = :updatedAt, errorMessage = :error",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "completed",
          ":noteId": noteId,
          ":topic": responseTopic,
          ":summary": responseSummary,
          ":cards": stack.cards,
          ":newCards": newCardsCount,
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

async function generateCompleteStack(input: {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
  initialAnchor?: FlashcardAnchor | null;
}): Promise<StackResponse> {
  const aggregated: UserNoteCardRecord[] = [];
  let anchor: FlashcardAnchor | null = input.initialAnchor ?? null;
  let derivedTopic: string | null = null;
  const maxIterations = 10;
  const formatCardForLog = (card?: UserNoteCardRecord) => {
    if (!card) {
      return "n/a";
    }
    const front = card.front.replace(/\s+/g, " ").slice(0, 80);
    const back = card.back.replace(/\s+/g, " ").slice(0, 80);
    return `Front: ${front || "(empty)"} | Back: ${back || "(empty)"}`;
  };

  for (let index = 0; index < maxIterations; index += 1) {
    const chunk = await generateAnkiStack({
      ...input,
      anchorCard: anchor,
    });
    if (!derivedTopic && chunk.topic) {
      derivedTopic = chunk.topic;
    }
    if (!chunk.cards.length) {
      console.info(
        "[general-note-job] Attempt %d returned 0 cards; stopping.",
        index + 1
      );
      break;
    }
    aggregated.push(...chunk.cards);
    const last = chunk.cards[chunk.cards.length - 1];
    anchor = {
      front: last.front,
      back: last.back,
      extra: last.extra ?? null,
    };
    console.info(
      "[general-note-job] Attempt %d produced %d cards (total=%d). First=%s, Last=%s",
      index + 1,
      chunk.cards.length,
      aggregated.length,
      formatCardForLog(aggregated[0]),
      formatCardForLog(aggregated[aggregated.length - 1])
    );
  }

  return {
    topic: derivedTopic ?? input.topic ?? "Interview study stack",
    summary: null,
    cards: aggregated,
  };
}

async function generateAnkiStack(input: {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
  anchorCard?: FlashcardAnchor | null;
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
    input.anchorCard
      ? [
          "Resume from the text immediately after the last saved flashcard.",
          `Previous front: ${input.anchorCard.front}`,
          `Previous back: ${input.anchorCard.back}`,
          input.anchorCard.extra
            ? `Previous extra: ${input.anchorCard.extra}`
            : null,
          "Locate where that flashcard content lives within the provided text, skip it, then continue generating cards right after that section.",
        ].join("\n")
      : "Start from the beginning of the provided content.",
    "Break the material into logical sections (headings, paragraphs, phases) and create at least one card per important idea.",
    "Add summary cards that capture the most critical takeaways for each major section before diving into supporting details.",
    "Generate as many cards as needed to cover the entire source material—avoid arbitrary limits like 10 cards; long-form content should typically yield dozens of cards.",
    "Try to process as many content as possible in one run, dont stop processing prematurely.",
    "Do not be overly concise—cover every important insight from the provided material.",
    "If there is no remaining content after the previous flashcard, return the JSON payload with an empty cards array.",
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
    .map((card: any) => normalizeCard(card))
    .filter((card): card is UserNoteCardRecord => Boolean(card));

  return { topic, summary: null, cards };
}

function normalizeCard(card: any): UserNoteCardRecord | null {
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
    id: crypto.randomUUID(),
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

async function findExistingNote(
  userId: string,
  url: string
): Promise<UserNoteRecord | null> {
  const query = new QueryCommand({
    TableName: userNotesTableName,
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "sourceUrl = :sourceUrl",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":sourceUrl": url,
    },
    Limit: 1,
  });

  try {
    const result = await docClient.send(query);
    const items = (result.Items as UserNoteRecord[] | undefined) ?? [];
    return items[0] ?? null;
  } catch (error) {
    console.error("Failed to load existing note", error);
    throw error;
  }
}

function buildAnchorFromCard(
  card?: UserNoteCardRecord
): FlashcardAnchor | null {
  if (!card) {
    return null;
  }
  return {
    front: card.front,
    back: card.back,
    extra: card.extra ?? null,
  };
}
