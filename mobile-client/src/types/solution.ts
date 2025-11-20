export interface LeetCodeSolution {
  id: string;
  problemNumber: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
  language: string;
  notes?: string;
  tags: string[];

  // FSR scheduling data
  easeFactor: number;
  interval: number; // spacing duration in seconds
  repetitions: number;
  nextReviewDate: Date;
  lastReviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSession {
  solutionId: string;
  reviewedAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSpent?: number;
}

export interface UserStats {
  totalSolutions: number;
  totalReviews: number;
  streak: number;
  lastReviewDate?: Date;
  averageEaseFactor: number;
}
