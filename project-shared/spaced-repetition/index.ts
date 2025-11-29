export type ReviewDifficulty = 'easy' | 'good' | 'hard'

export interface SpacedRepetitionConfig {
  learningStepsSeconds: number[]
  easyBonus: number
  daySeconds: number
  initialEaseFactor: number
  minEaseFactor: number
}

export interface SpacedRepetitionSnapshot {
  easeFactor?: number
  interval?: number
  repetitions?: number
}

export interface SpacedRepetitionResult {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewedAt: Date
}

export class SpacedRepetitionScheduler {
  private readonly config: SpacedRepetitionConfig

  constructor(config: SpacedRepetitionConfig) {
    this.config = config
  }

  getInitialIntervalSeconds(): number {
    return this.config.learningStepsSeconds[0] ?? this.config.daySeconds
  }

  schedule(snapshot: SpacedRepetitionSnapshot | undefined, difficulty: ReviewDifficulty): SpacedRepetitionResult {
    const now = new Date()
    const easeFactor = snapshot?.easeFactor ?? this.config.initialEaseFactor
    const repetitions = snapshot?.repetitions ?? 0
    const intervalSeconds = snapshot?.interval ?? this.getInitialIntervalSeconds()

    if (difficulty === 'hard') {
      const resetInterval = this.config.learningStepsSeconds[0] ?? this.config.daySeconds
      const updatedEase = this.calculateEaseFactor(easeFactor, 2)
      const nextReviewDate = new Date(now.getTime() + resetInterval * 1000)
      return {
        easeFactor: updatedEase,
        interval: resetInterval,
        repetitions: 0,
        nextReviewDate,
        lastReviewedAt: now,
      }
    }

    const quality = difficulty === 'easy' ? 5 : 4
    const updatedEase = this.calculateEaseFactor(easeFactor, quality)
    const nextRepetitions = repetitions + 1
    const nextIntervalSeconds = this.calculateInterval(intervalSeconds, nextRepetitions, updatedEase, difficulty)
    const nextReviewDate = new Date(now.getTime() + nextIntervalSeconds * 1000)

    return {
      easeFactor: updatedEase,
      interval: nextIntervalSeconds,
      repetitions: nextRepetitions,
      nextReviewDate,
      lastReviewedAt: now,
    }
  }

  private calculateInterval(
    currentInterval: number,
    repetitions: number,
    easeFactor: number,
    difficulty: ReviewDifficulty,
  ): number {
    const steps = this.config.learningStepsSeconds
    if (repetitions <= steps.length) {
      const index = Math.max(0, Math.min(repetitions - 1, steps.length - 1))
      return steps[index]
    }

    const currentDays = Math.max(1, currentInterval / this.config.daySeconds)
    const bonus = difficulty === 'easy' ? this.config.easyBonus : 1
    const nextDays = Math.max(1, Math.round(currentDays * easeFactor * bonus))
    return nextDays * this.config.daySeconds
  }

  private calculateEaseFactor(current: number, quality: number): number {
    const updated = current + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return Math.max(this.config.minEaseFactor, updated)
  }
}
