export interface DsaQuestion {
  id: string;
  userId: string;
  questionIndex: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Good" | "Hard";
  description: string;
  solution: string | null;
  idealSolutionCode: string | null;
  note: string | null;
  tags?: string[];
  topicTags?: string[];
  lastReviewedAt?: string | null;
  lastReviewStatus?: "easy" | "good" | "hard" | null;
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionReviewState {
  easeFactor: number;
  interval: number; // spacing duration in seconds
  repetitions: number;
  nextReviewDate: string;
  lastReviewedAt?: string | null;
}

export type QuestionReminder = DsaQuestion & QuestionReviewState;
