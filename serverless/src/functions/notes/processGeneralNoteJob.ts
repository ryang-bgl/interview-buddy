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
import {
  chunkMarkdownBySections,
  groupChunksBySize,
  type MarkdownChunk,
} from "../../shared/markdownChunker";

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

    // Chunk the markdown content for processing
    console.info("[general-note-job] Starting chunked processing", {
      jobId,
      contentLength: jobRecord.requestPayload.content.length,
    });

    const markdownChunks = chunkMarkdownBySections(jobRecord.requestPayload.content);
    console.info("[general-note-job] Chunks created", {
      jobId,
      chunkCount: markdownChunks.length,
    });

    // Group chunks to optimize API calls
    const chunkGroups = groupChunksBySize(markdownChunks, 3000); // 3000 tokens per group
    console.info("[general-note-job] Chunk groups created", {
      jobId,
      groupCount: chunkGroups.length,
    });

    // Process each chunk group
    for (let groupIndex = 0; groupIndex < chunkGroups.length; groupIndex++) {
      const chunkGroup = chunkGroups[groupIndex];
      console.info("[general-note-job] Processing chunk group", {
        jobId,
        groupIndex: groupIndex + 1,
        totalGroups: chunkGroups.length,
        chunkCount: chunkGroup.length,
      });

      // Combine chunks in this group
      const combinedContent = chunkGroup
        .map(chunk => chunk.content)
        .join('\n\n');

      try {
        const newCards = await generateOpenAiStack(combinedContent);

        if (newCards.length > 0) {
          console.info("[general-note-job] Generated cards for chunk group", {
            jobId,
            groupIndex: groupIndex + 1,
            cardsGenerated: newCards.length,
            existingCardsCount: noteToProcess.cards.length,
          });

          // Save progress after each successful group
          try {
            // Add only the NEW cards to existing cards
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
              // Create new note with cards from this group
              await persistNewNoteWithFlashCards({
                jobRecord,
                noteToProcess: noteToProcess,
                newCards: newCards, // Only save new cards, not accumulated
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

            // Update job progress with total card count
            updateJobProgress(jobId, noteToProcess.cards.length);

            console.info("[general-note-job] Saved cards for chunk group", {
              jobId,
              groupIndex: groupIndex + 1,
              totalCardsAfterSave: noteToProcess.cards.length,
            });
          } catch (saveError) {
            console.error("[general-note-job] Failed to save progress", {
              jobId,
              groupIndex: groupIndex + 1,
              saveError,
            });
            // Continue processing even if save failed
          }
        }

        // Small delay between API calls to avoid rate limits
        if (groupIndex < chunkGroups.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[general-note-job] Failed to process chunk group", {
          jobId,
          groupIndex: groupIndex + 1,
          error: errorMessage,
        });

        // Don't retry on authentication errors
        if (errorMessage.includes("OPENAI_API_KEY") ||
            errorMessage.includes("authentication") ||
            errorMessage.includes("401")) {
          console.error("[general-note-job] Authentication error, stopping processing", {
            jobId,
            error: errorMessage,
          });
          break;
        }

        // Continue with next chunk group even if current one failed
        continue;
      }
    }

    console.info("[general-note-job] Chunked processing completed", {
      jobId,
      totalGroups: chunkGroups.length,
      totalCardsInDb: noteToProcess.cards.length,
    });

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
