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
