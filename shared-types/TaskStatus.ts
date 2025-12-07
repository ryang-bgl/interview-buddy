/**
 * Shared TypeScript types for Task/Job Status across LeetStack project
 * Used by browser extension, serverless, web-app, and mobile-client
 */

// ===== Base Task Status Types =====

/**
 * Core status values for any async task/job
 */
export type TaskStatus =
  | "pending" // Task is queued and waiting to be processed
  | "processing" // Task is currently being processed
  | "completed" // Task completed successfully
  | "failed" // Task failed with an error
  | "cancelled" // Task was cancelled before completion
  | "retrying"; // Task failed and is being retried

/**
 * Priority levels for tasks
 */
export type TaskPriority = "low" | "normal" | "high" | "urgent";

/**
 * Common metadata for all tasks
 */
export interface BaseTaskMetadata {
  /** Unique identifier for the task */
  id: string;
  /** Current status of the task */
  status: TaskStatus;
  /** Timestamp when task was created */
  createdAt: string;
  /** Timestamp when task was last updated */
  updatedAt: string;
  /** Timestamp when task expires (optional) */
  expiresAt?: string;
  /** Priority level of the task */
  priority?: TaskPriority;
  /** Progress percentage (0-100) */
  progressPercent?: number;
  /** Current step being processed */
  currentStep?: string;
  /** Total number of steps */
  totalSteps?: number;
  /** Error message if status is 'failed' */
  errorMessage?: string | null;
  /** Number of retry attempts */
  retryCount?: number;
  /** Maximum allowed retries */
  maxRetries?: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Tags for categorizing tasks */
  tags?: string[];
}

// ===== General Note Job Specific Types =====

/**
 * Specialized status for general note generation jobs
 */
export type GeneralNoteJobStatus = TaskStatus;

/**
 * Progress tracking for note generation
 */
export interface GeneralNoteJobProgress {
  /** Total number of chunks to process */
  totalChunks: number;
  /** Number of chunks processed so far */
  processedChunks: number;
  /** Total number of cards generated */
  totalCards: number;
  /** Currently processing chunk index */
  currentChunkIndex?: number;
  /** Title of current section being processed */
  currentSectionTitle?: string;
}

/**
 * Result of a completed general note job
 */
export interface GeneralNoteJobResult {
  /** ID of the created/updated note */
  noteId: string | null;
  /** Topic/title of the note */
  topic: string | null;
  /** Summary of the content */
  summary: string | null;
  /** Generated flashcards */
  cards: UserNoteCardRecord[];
  /** Number of new cards created in this job */
  newCards: number;
  /** Processing statistics */
  stats?: {
    /** Total processing time in milliseconds */
    durationMs: number;
    /** Number of API calls made */
    apiCalls: number;
    /** Average cards per chunk */
    avgCardsPerChunk: number;
  };
}

/**
 * Full general note job status response
 */
export interface GeneralNoteJobStatusResponse extends BaseTaskMetadata {
  /** URL of the source content */
  url: string;
  /** Topic specified by user or extracted from content */
  topic: string | null;
  /** User ID who initiated the job */
  userId: string;
  noteId: string;
  /** Generated flashcards (actual cards data) */
  cards: UserNoteCardRecord[];
  /** Number of cards created */
  totalCards: number;
  /** Error message if job failed */
  errorMessage?: string | null;
}

// ===== Card Types =====

/**
 * User note card record
 */
export interface UserNoteCardRecord {
  /** Unique identifier for the card */
  id: string;
  /** Front side of the card (question) */
  front: string;
  /** Back side of the card (answer) */
  back: string;
  /** Additional tips/extra information */
  extra?: string;
  /** Tags for categorizing the card */
  tags?: string[];
}

// ===== Task Creation Types =====

/**
 * Request to create a new general note job
 */
export interface CreateGeneralNoteJobRequest {
  /** URL of the source content */
  url: string;
  /** Markdown content to process */
  content: string;
  /** Optional topic/title */
  topic?: string | null;
  /** Optional special requirements */
  requirements?: string | null;
  /** Priority level (defaults to normal) */
  priority?: TaskPriority;
  /** Custom tags for the job */
  tags?: string[];
}

/**
 * Response when creating a new job
 */
export interface CreateGeneralNoteJobResponse {
  /** ID of the created job */
  jobId: string;
  /** Estimated processing time */
  estimatedTime?: number;
  /** Queue position (if available) */
  queuePosition?: number;
}

// ===== Polling and Query Types =====

/**
 * Query parameters for listing jobs
 */
export interface ListJobsQuery {
  /** Filter by status */
  status?: TaskStatus;
  /** Filter by user ID */
  userId?: string;
  /** Filter by job type */
  type?: string;
  /** Filter by tags */
  tags?: string[];
  /** Number of results to return */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
  /** Sort order */
  sortBy?: "createdAt" | "updatedAt" | "priority";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
  /** Filter created after date */
  createdAfter?: string;
  /** Filter created before date */
  createdBefore?: string;
}

// ===== Polling Configuration =====

/**
 * Configuration for polling task status
 */
export interface TaskPollingConfig {
  /** Interval between polls in milliseconds */
  intervalMs: number;
  /** Maximum number of polls before giving up */
  maxPolls?: number;
  /** Exponential backoff factor */
  backoffFactor?: number;
  /** Maximum interval between polls */
  maxIntervalMs?: number;
  /** Whether to stop polling on error */
  stopOnError?: boolean;
}

/**
 * Default polling configurations
 */
export const DEFAULT_POLLING_CONFIG: Record<string, TaskPollingConfig> = {
  /** Default for quick tasks (under 30 seconds) */
  quick: {
    intervalMs: 500,
    maxPolls: 60,
    backoffFactor: 1.1,
    maxIntervalMs: 2000,
  },
  /** Default for medium tasks (1-5 minutes) */
  medium: {
    intervalMs: 1500,
    maxPolls: 200,
    backoffFactor: 1.2,
    maxIntervalMs: 5000,
  },
  /** Default for long tasks (5+ minutes) */
  long: {
    intervalMs: 3000,
    maxPolls: 300,
    backoffFactor: 1.5,
    maxIntervalMs: 10000,
  },
};

// ===== Utility Types =====

/**
 * Extract just the status from any task type
 */
export type TaskStatusOnly<T extends BaseTaskMetadata> = Pick<
  T,
  "status" | "errorMessage"
>;

/**
 * Create a task status update
 */
export type TaskStatusUpdate<T extends BaseTaskMetadata = BaseTaskMetadata> =
  | Partial<
      Pick<T, "status" | "progressPercent" | "currentStep" | "errorMessage">
    >
  | { status: "completed"; result: any }
  | { status: "failed"; error: Error };

// ===== Error Types =====

/**
 * Task-related errors
 */
export interface TaskError extends Error {
  /** ID of the task that failed */
  taskId: string;
  /** Status when error occurred */
  status: TaskStatus;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Original error that caused this */
  cause?: Error;
}

// ===== Type Guards =====

/**
 * Check if a task is in a terminal state
 */
export function isTaskTerminal(status: TaskStatus): boolean {
  return (
    status === "completed" || status === "failed" || status === "cancelled"
  );
}

/**
 * Check if a task is actively being processed
 */
export function isTaskActive(status: TaskStatus): boolean {
  return status === "processing" || status === "retrying";
}

/**
 * Check if a task is waiting to be processed
 */
export function isTaskPending(status: TaskStatus): boolean {
  return status === "pending";
}
