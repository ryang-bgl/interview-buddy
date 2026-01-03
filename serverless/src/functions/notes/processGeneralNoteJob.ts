import crypto from "node:crypto";
import { DynamoDBStreamHandler } from "aws-lambda";
import {
  GetCommand,
  PutCommand,
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
import { findNoteByUrl, findNoteById } from "../../shared/notes";

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

  // Validate that the URL exists and is properly formatted
  if (!jobRecord.url || jobRecord.url.trim().length === 0) {
    const errorMsg = "Source URL is required but missing";
    console.error("[general-note-job] " + errorMsg);
    await markJobFailed(jobId, errorMsg);
    throw new Error(errorMsg);
  }

  // Additional validation to ensure URL is valid
  try {
    const parsedUrl = new URL(jobRecord.url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      const errorMsg = `Invalid source URL protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed`;
      console.error("[general-note-job] " + errorMsg);
      await markJobFailed(jobId, errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = `Invalid source URL format: ${jobRecord.url}`;
    console.error("[general-note-job] " + errorMsg);
    await markJobFailed(jobId, errorMsg);
    throw new Error(errorMsg);
  }

  try {
    let noteToProcess: UserNoteRecord | null = await findNoteByUrl({
      tableName: userNotesTableName,
      userId: jobRecord.userId,
      url: jobRecord.url,
    });

    if (noteToProcess === null || noteToProcess === undefined) {
      noteToProcess = {
        userId: jobRecord.userId,
        sourceUrl: jobRecord.url,
        noteId: null,
        cards: [],
        topic: jobRecord.topic ?? undefined,
      };
    }

    // Chunk the markdown content for processing
    console.info("[general-note-job] Starting chunked processing", {
      jobId,
      contentLength: jobRecord.requestPayload?.content.length ?? 0,
    });

    const markdownChunks = chunkMarkdownBySections(
      jobRecord.requestPayload?.content ?? ""
    );
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
        .map((chunk) => chunk.content)
        .join("\n\n");

      try {
        const newCards = await generateOpenAiStack(combinedContent);

        if (newCards.length > 0) {
          console.info("[general-note-job] Generated cards for chunk group", {
            jobId,
            groupIndex: groupIndex + 1,
            cardsGenerated: newCards.length,
            existingCardsCount: noteToProcess?.cards.length ?? 0,
          });

          // Save progress after each successful group
          try {
            // Add only the NEW cards to existing cards
            const allCards = [...(noteToProcess?.cards ?? []), ...newCards];

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
              const createdNote = await persistNewNoteWithFlashCards({
                jobRecord,
                noteToProcess: noteToProcess!,
                newCards: newCards, // Only save new cards, not accumulated
              });
              console.log("==== created note ", createdNote.noteId);

              // Verify the note was actually saved by querying it directly by ID
              // Add retry logic to handle DynamoDB eventual consistency
              const MAX_RETRIES = 3;
              const RETRY_DELAY_MS = 500;
              let verifiedNote: UserNoteRecord | null = null;

              for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                if (attempt > 0) {
                  console.info(
                    `[general-note-job] Retry ${attempt}/${
                      MAX_RETRIES - 1
                    } to find saved note by ID`
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, RETRY_DELAY_MS)
                  );
                }

                if (!createdNote.noteId) {
                  throw new Error("Created note has no noteId");
                }
                verifiedNote = await findNoteById(
                  userNotesTableName,
                  jobRecord.userId,
                  createdNote.noteId
                );

                if (verifiedNote) {
                  // Also verify it has the expected cards
                  if (verifiedNote.cards.length === newCards.length) {
                    console.info(
                      "[general-note-job] Verified note has correct number of cards",
                      {
                        expected: newCards.length,
                        actual: verifiedNote.cards.length,
                      }
                    );
                    break;
                  } else {
                    console.warn(
                      "[general-note-job] Note found but card count mismatch",
                      {
                        expected: newCards.length,
                        actual: verifiedNote.cards.length,
                      }
                    );
                  }
                }
              }

              if (!verifiedNote) {
                const errorMsg = `Failed to save note: created note with ID ${createdNote.noteId} but couldn't retrieve it after ${MAX_RETRIES} attempts`;
                console.error("[general-note-job] " + errorMsg);

                // Mark the job as failed
                await markJobFailed(jobId, errorMsg);
                throw new Error(errorMsg);
              }

              console.log(
                "==== verified saved note with ID",
                verifiedNote.noteId,
                "and",
                verifiedNote.cards.length,
                "cards"
              );
              noteToProcess = verifiedNote;
            }

            // Update job progress with total card count
            updateJobProgress(jobId, noteToProcess?.cards.length ?? 0);

            console.info("[general-note-job] Saved cards for chunk group", {
              jobId,
              groupIndex: groupIndex + 1,
              totalCardsAfterSave: noteToProcess?.cards.length ?? 0,
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
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[general-note-job] Failed to process chunk group", {
          jobId,
          groupIndex: groupIndex + 1,
          error: errorMessage,
        });

        // Don't retry on authentication errors
        if (
          errorMessage.includes("OPENAI_API_KEY") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("401")
        ) {
          console.error(
            "[general-note-job] Authentication error, stopping processing",
            {
              jobId,
              error: errorMessage,
            }
          );
          break;
        }

        // Continue with next chunk group even if current one failed
        continue;
      }
    }

    console.info("[general-note-job] Chunked processing completed", {
      jobId,
      totalGroups: chunkGroups.length,
      totalCardsInDb: noteToProcess?.cards.length ?? 0,
    });

    if (noteToProcess && noteToProcess.noteId) {
      // Update job with final results
      await updateJobWithResults(
        jobId,
        noteToProcess.noteId,
        noteToProcess.cards
      );
    }
    await updateJobStatus(jobId, "completed");
  } catch (error) {
    console.error("[general-note-job] Processor failed", error);
    await markJobFailed(jobId, error);
  }
}

function computeCardTags(cards: UserNoteCardRecord[]): string[] {
  const tags = new Set<string>();
  for (const card of cards) {
    for (const tag of card.tags ?? []) {
      const trimmed = tag.trim();
      if (trimmed) {
        tags.add(trimmed);
      }
    }
  }
  return Array.from(tags);
}

async function persistNewNoteWithFlashCards({
  jobRecord,
  noteToProcess,
  newCards,
}: {
  jobRecord: UserNoteJobRecord;
  noteToProcess: UserNoteRecord;
  newCards: UserNoteCardRecord[];
}): Promise<UserNoteRecord> {
  const now = new Date().toISOString();
  const noteId = crypto.randomUUID();

  // Validate sourceUrl before creating the note
  if (!jobRecord.url || jobRecord.url.trim().length === 0) {
    throw new Error("Cannot create note: sourceUrl is missing");
  }

  const noteRecord: UserNoteRecord = {
    userId: jobRecord.userId,
    noteId,
    sourceUrl: jobRecord.url,
    // Use topic from jobRecord first, then fall back to noteToProcess
    topic: jobRecord.topic ?? noteToProcess.topic,
    summary: noteToProcess.summary ?? undefined,
    cards: newCards,
    cardCount: newCards.length,
    tags: computeCardTags(newCards),
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: null,
    lastReviewStatus: null,
    reviewIntervalSeconds: undefined,
    reviewEaseFactor: undefined,
    reviewRepetitions: undefined,
    nextReviewDate: null,
  };

  // Log for debugging
  console.info("[general-note-job] Creating note record", {
    noteId,
    userId: jobRecord.userId,
    sourceUrl: jobRecord.url,
    cardCount: newCards.length,
  });

  await docClient.send(
    new PutCommand({
      TableName: userNotesTableName,
      Item: noteRecord,
    })
  );

  console.info("[general-note-job] Created new note", {
    userId: jobRecord.userId,
    noteId,
    url: jobRecord.url,
    cardCount: newCards.length,
  });

  return noteRecord;
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
            : "Failed to generate flashcards",
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

async function updateJobProgress(jobId: string, totalCards: number) {
  await docClient.send(
    new UpdateCommand({
      TableName: jobsTableName,
      Key: { jobId },
      UpdateExpression: "SET #status = :status, totalCards = :totalCards",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "processing",
        ":totalCards": totalCards,
      },
    })
  );
}

async function updateJobWithResults(
  jobId: string,
  noteId: string,
  cards: UserNoteCardRecord[]
) {
  await docClient.send(
    new UpdateCommand({
      TableName: jobsTableName,
      Key: { jobId },
      UpdateExpression:
        "SET noteId = :noteId, cards = :cards, updatedAt = :updatedAt, totalCards = :totalCards",
      ExpressionAttributeValues: {
        ":noteId": noteId,
        ":cards": cards,
        ":totalCards": cards.length,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
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
      UpdateExpression:
        "SET cards = :cards, cardCount = :cardCount, tags = :tags, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":cards": cards,
        ":cardCount": cards.length,
        ":tags": computeCardTags(cards),
        ":updatedAt": now,
      },
    })
  );
}

export const __testHelpers = {
  generateOpenAiStack,
};
