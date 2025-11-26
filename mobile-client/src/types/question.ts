export interface DsaQuestion {
  id: string;
  userId: string;
  questionIndex: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  solution: string | null;
  idealSolutionCode: string | null;
  note: string | null;
  tags?: string[];
  topicTags?: string[];
  lastReviewedAt?: string;
  lastReviewStatus?: 'easy' | 'good' | 'hard';
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionReviewState {
  easeFactor: number;
  interval: number; // spacing duration in seconds
  repetitions: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
}

export type QuestionReminder = DsaQuestion & QuestionReviewState;
