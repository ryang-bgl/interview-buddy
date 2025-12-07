export interface UserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  leetstackUsername?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
}

export interface AiSolutionRecord {
  id: string;
  questionIndex: string;
  model: string;
  language: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDsaQuestionRecord {
  userId: string;
  questionIndex: string;
  title: string;
  titleSlug: string;
  questionId: string;
  difficulty: string;
  description: string;
  solution?: string;
  idealSolutionCode?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
  lastReviewStatus?: "easy" | "good" | "hard";
  reviewIntervalSeconds?: number;
  reviewEaseFactor?: number;
  reviewRepetitions?: number;
  nextReviewDate?: string;
}

export interface UserNoteCardRecord {
  id?: string;
  front: string;
  back: string;
  extra?: string | null;
  tags?: string[];
}

export interface UserNoteRecord {
  userId: string;
  noteId: string | null;
  sourceUrl: string;
  topic?: string;
  summary?: string;
  cards: UserNoteCardRecord[];
  createdAt?: string;
  updatedAt?: string;
  lastReviewedAt?: string | null;
  lastReviewStatus?: "easy" | "good" | "hard" | null;
  reviewIntervalSeconds?: number;
  reviewEaseFactor?: number;
  reviewRepetitions?: number;
  nextReviewDate?: string | null;
}

export interface UserFeedbackRecord {
  userId: string;
  feedbackId: string;
  message: string;
  pageUrl?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserNoteJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface UserNoteJobRecord {
  jobId: string;
  userId: string;
  url: string;
  topic?: string | null;
  requirements?: string | null;
  status: UserNoteJobStatus;
  requestPayload: {
    content: string;
    topic?: string | null;
    requirements?: string | null;
  };
  resultNoteId?: string | null;
  resultTopic?: string | null;
  resultSummary?: string | null;
  resultCards?: UserNoteCardRecord[];
  resultNewCards?: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
