import { ReviewDifficulty } from '@/config/spacedRepetition';

export interface FlashcardCardRecord {
  id?: string;
  front: string;
  back: string;
  extra?: string | null;
  tags?: string[];
}

export interface FlashcardNoteRecord {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  cards: FlashcardCardRecord[];
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: ReviewDifficulty | null;
}

export interface FlashcardNoteSummary {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: ReviewDifficulty | null;
  cardCount: number;
  tags: string[];
}

export interface FlashcardNoteSummaryResponse {
  notes: FlashcardNoteSummary[];
}
