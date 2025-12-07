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
import {
  generateOpenAiStack,
  type FlashcardStackResponse,
} from "../../shared/openAiNotes";

const jobsTableName = process.env.GENERAL_NOTE_JOBS_TABLE_NAME;
const userNotesTableName = process.env.USER_NOTES_TABLE_NAME;

if (!jobsTableName) {
  throw new Error("GENERAL_NOTE_JOBS_TABLE_NAME env var must be set");
}

if (!userNotesTableName) {
  throw new Error("USER_NOTES_TABLE_NAME env var must be set");
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
  const startTime = Date.now();

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

  console.info("[general-note-job] Starting job processing", {
    jobId,
    url: jobRecord.url,
    userId: jobRecord.userId,
  });

  await updateJobStatus(jobId, "processing");

  try {
    let noteToProcess: UserNoteRecord | null = await findExistingNote(
      jobRecord.userId,
      jobRecord.url
    );

    if (noteToProcess === null || noteToProcess === undefined) {
      noteToProcess = {
        userId: jobRecord.userId,
        sourceUrl: jobRecord.url,
        noteId: null,
        cards: [],
      };
    }

    // Initialize retry variables
    let stack: FlashcardStackResponse;
    let retryCount = 0;
    const maxRetries = 10;
    let lastError: Error | null = null;

    // Retry logic: keep generating until we have cards or max retries reached
    do {
      const existingCards = noteToProcess.cards;
      try {
        console.info("[general-note-job] Generation attempt", {
          jobId,
          attempt: retryCount + 1,
          maxRetries,
          existingCardsCount: noteToProcess.cards.length,
        });

        let lastCards: UserNoteCardRecord[] = [];
        const length = existingCards.length;
        if (length > 2) {
          lastCards = [existingCards[length - 2], existingCards[length - 1]];
        } else if (length > 1) {
          lastCards = [existingCards[length - 1]];
        }

        const newCards = await generateOpenAiStack(
          jobRecord.requestPayload.content,
          lastCards
        );
        console.log(
          "==== last card for generate note",
          lastCards,
          newCards?.length > 0 ? newCards[newCards.length - 1] : []
        );

        // Check if we generated new cards
        const newCardsCount = newCards.length;

        if (newCardsCount > 0) {
          // Success - we have new cards
          console.info("[general-note-job] Generated new cards", {
            jobId,
            attempt: retryCount + 1,
            newCardsCount,
          });

          // Save progress after each successful generation
          try {
            const allCards = [...noteToProcess.cards, ...newCards];
            if (noteToProcess && noteToProcess.noteId) {
              // Update existing note with new cards only
              await updateNoteCards(
                jobRecord.userId,
                noteToProcess.noteId,
                allCards
              );
              noteToProcess.cards = allCards;
            } else {
              // Create new note
              await persistNewNoteWithFlashCards({
                jobRecord,
                noteToProcess: noteToProcess,
                newCards,
              });
              // Get the actual noteId from the database
              const createdNote = await findExistingNote(
                jobRecord.userId,
                jobRecord.url
              );
              console.log("==== created note ", createdNote?.noteId);
              if (createdNote) {
                noteToProcess = createdNote;
              } else {
                console.log(
                  "====== error in finding new note after saving, createdNote is null"
                );
              }
            }
            updateJobProgress(jobId, noteToProcess.cards.length);
          } catch (saveError) {
            console.error("[general-note-job] Failed to save progress", {
              jobId,
              attempt: retryCount + 1,
              saveError,
            });
            // Continue with retry even if save failed, but log the error
          }

          // If this was the last attempt or we have enough cards, break
          if (retryCount >= maxRetries - 1 || newCardsCount === 0) {
            console.info(
              "[general-note-job] Generation completed, total retry",
              retryCount,
              "total cards",
              noteToProcess.cards.length,
              "reason",
              retryCount >= maxRetries - 1
                ? "max retries reached"
                : "no new cards generated"
            );
            break;
          }

          // Continue to next retry to get more cards
          retryCount++;

          console.info(
            "[general-note-job] Continuing to generate more cards",
            retryCount,
            noteToProcess.cards.length,
            jobId
          );
          // Delay before next retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error("Unknown error during generation");
        console.error("[general-note-job] Generation attempt failed", {
          jobId,
          attempt: retryCount + 1,
          error: lastError.message,
        });

        retryCount++;

        // Don't retry on certain errors (like authentication)
        if (
          lastError.message.includes("OPENAI_API_KEY") ||
          lastError.message.includes("authentication") ||
          lastError.message.includes("401")
        ) {
          console.error(
            "[general-note-job] Authentication error, not retrying",
            {
              jobId,
              error: lastError.message,
            }
          );
          break;
        }

        // Add delay before retry
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } while (retryCount < maxRetries);

    await updateJobStatus(jobId, "completed");
  } catch (error) {
    console.error("[general-note-job] Processor failed", error);
    await markJobFailed(jobId, error);
  }
}

async function persistNewNoteWithFlashCards({
  jobRecord,
  noteToProcess,
  newCards,
}: {
  jobRecord: UserNoteJobRecord;
  noteToProcess: UserNoteRecord;
  newCards: UserNoteCardRecord[];
}) {
  const now = new Date().toISOString();

  const noteRecord: UserNoteRecord = {
    userId: jobRecord.userId,
    noteId: crypto.randomUUID(),
    sourceUrl: jobRecord.url,
    topic: noteToProcess.topic,
    summary: noteToProcess.summary ?? undefined,
    cards: newCards,
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

async function markJobFailed(jobId: string, error: unknown) {
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

async function updateJobProgress(jobId: string, cards: number) {
  await docClient.send(
    new UpdateCommand({
      TableName: jobsTableName,
      Key: { jobId },
      UpdateExpression: "SET #status = :status, resultCards = :cards",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "processing",
        ":cards": cards,
      },
    })
  );
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

async function updateNoteCards(
  userId: string,
  noteId: string,
  cards: UserNoteCardRecord[]
): Promise<void> {
  const now = new Date().toISOString();
  await docClient.send(
    new UpdateCommand({
      TableName: userNotesTableName,
      Key: { userId, noteId },
      UpdateExpression: "SET cards = :cards, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":cards": cards,
        ":updatedAt": now,
      },
    })
  );
}

export const __testHelpers = {
  generateOpenAiStack,
};
