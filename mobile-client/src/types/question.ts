export interface DsaQuestion {
  id: string;
  userId: string;
  questionIndex: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPaidOnly: boolean;
  description: string;
  solution: string | null;
  idealSolutionCode: string | null;
  note: string | null;
  exampleTestcases: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionReviewState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
}

export type QuestionReminder = DsaQuestion & QuestionReviewState;
