import { spacedRepetitionConfig, ReviewDifficulty } from '@/config/spacedRepetition';

export interface SpacedRepetitionSnapshot {
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
}

export interface SpacedRepetitionResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewedAt: Date;
}

const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;

export class SpacedRepetitionScheduler {
  constructor(private readonly config = spacedRepetitionConfig) {}

  getInitialIntervalSeconds(): number {
    return this.config.patternSeconds[0];
  }

  schedule(
    snapshot: SpacedRepetitionSnapshot | undefined,
    difficulty: ReviewDifficulty
  ): SpacedRepetitionResult {
    const currentEase = snapshot?.easeFactor ?? INITIAL_EASE_FACTOR;
    const currentStage = snapshot?.repetitions ?? 0;
    const stageCount = this.config.patternSeconds.length;

    let nextStage = currentStage;
    switch (difficulty) {
      case 'easy':
        nextStage = Math.min(currentStage + this.config.easyStep, stageCount - 1);
        break;
      case 'medium':
        nextStage = Math.max(currentStage - this.config.mediumStep, 0);
        break;
      case 'hard':
        nextStage = 0;
        break;
    }

    const intervalSeconds = this.config.patternSeconds[nextStage] ?? this.config.patternSeconds[stageCount - 1];
    const lastReviewedAt = new Date();
    const nextReviewDate = new Date(lastReviewedAt.getTime() + intervalSeconds * 1000);

    return {
      easeFactor: this.calculateEaseFactor(currentEase, difficulty),
      repetitions: nextStage,
      interval: intervalSeconds,
      nextReviewDate,
      lastReviewedAt,
    };
  }

  private calculateEaseFactor(current: number, difficulty: ReviewDifficulty): number {
    let delta = 0;
    switch (difficulty) {
      case 'easy':
        delta = 0.15;
        break;
      case 'medium':
        delta = -0.05;
        break;
      case 'hard':
        delta = -0.3;
        break;
    }

    return Math.max(MIN_EASE_FACTOR, current + delta);
  }
}

export const spacedRepetitionScheduler = new SpacedRepetitionScheduler();
