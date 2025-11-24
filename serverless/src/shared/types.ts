export interface UserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  leetstackUsername?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
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
  exampleTestcases?: string;
  paidOnly: boolean;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
  lastReviewStatus?: 'easy' | 'good' | 'hard';
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
  noteId: string;
  sourceUrl: string;
  topic?: string;
  summary?: string;
  requestPayload: {
    url: string;
    payload: string;
    topic?: string | null;
    requirements?: string | null;
  };
  cards: UserNoteCardRecord[];
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string | null;
  lastReviewStatus?: 'easy' | 'good' | 'hard' | null;
}

export type UserNoteJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
