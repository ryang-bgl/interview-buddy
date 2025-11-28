export type ReviewDifficulty = 'easy' | 'good' | 'hard'

export interface SpacedRepetitionConfig {
  learningStepsSeconds: number[]
  easyBonus: number
  daySeconds: number
  initialEaseFactor: number
  minEaseFactor: number
}

export interface SpacedRepetitionSnapshot {
  easeFactor: number
  interval: number
  repetitions: number
}

export interface SpacedRepetitionResult {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  lastReviewedAt: Date
}

export interface ReviewState extends SpacedRepetitionSnapshot {
  nextReviewDate: string
  lastReviewedAt: string | null
}

const SECONDS_PER_DAY = 60 * 60 * 24
const defaultLearningSteps = [SECONDS_PER_DAY, 3 * SECONDS_PER_DAY]

const parseLearningSteps = (value?: string): number[] | null => {
  if (!value) return null
  const parsed = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((duration) => Number.isFinite(duration) && duration > 0)
  return parsed.length ? parsed : null
}

const envSteps = parseLearningSteps(import.meta.env.VITE_SR_LEARNING_STEPS)

export const spacedRepetitionConfig: SpacedRepetitionConfig = {
  learningStepsSeconds: envSteps ?? defaultLearningSteps,
  easyBonus: Number(import.meta.env.VITE_SR_EASY_BONUS ?? 1.3),
  daySeconds: SECONDS_PER_DAY,
  initialEaseFactor: Number(import.meta.env.VITE_SR_INITIAL_EASE ?? 2.5),
  minEaseFactor: Number(import.meta.env.VITE_SR_MIN_EASE ?? 1.3),
}

export class SpacedRepetitionScheduler {
  private readonly config: SpacedRepetitionConfig

  constructor(config: SpacedRepetitionConfig = spacedRepetitionConfig) {
    this.config = config
  }

  getInitialIntervalSeconds(): number {
    return this.config.learningStepsSeconds[0] ?? this.config.daySeconds
  }

  schedule(snapshot: SpacedRepetitionSnapshot | undefined, difficulty: ReviewDifficulty) {
    const now = new Date()
    const easeFactor = snapshot?.easeFactor ?? this.config.initialEaseFactor
    const repetitions = snapshot?.repetitions ?? 0
    const intervalSeconds = snapshot?.interval ?? this.getInitialIntervalSeconds()

    if (difficulty === 'hard') {
      const resetInterval = this.getInitialIntervalSeconds()
      const nextReviewDate = new Date(now.getTime() + resetInterval * 1000)
      return {
        easeFactor: this.calculateEaseFactor(easeFactor, 2),
        interval: resetInterval,
        repetitions: 0,
        nextReviewDate,
        lastReviewedAt: now,
      }
    }

    const quality = difficulty === 'easy' ? 5 : 4
    const updatedEase = this.calculateEaseFactor(easeFactor, quality)
    const nextRepetitions = repetitions + 1
    const nextIntervalSeconds = this.calculateInterval(
      intervalSeconds,
      nextRepetitions,
      updatedEase,
      difficulty,
    )
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
  ) {
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

  private calculateEaseFactor(current: number, quality: number) {
    const updated = current + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return Math.max(this.config.minEaseFactor, updated)
  }
}

export const spacedRepetitionScheduler = new SpacedRepetitionScheduler()

export const createInitialReviewState = (): ReviewState => {
  const interval = spacedRepetitionScheduler.getInitialIntervalSeconds()
  return {
    easeFactor: spacedRepetitionConfig.initialEaseFactor,
    interval,
    repetitions: 0,
    nextReviewDate: new Date(Date.now() + interval * 1000).toISOString(),
    lastReviewedAt: null,
  }
}
