import {
  SpacedRepetitionScheduler,
  type SpacedRepetitionConfig,
  type SpacedRepetitionSnapshot,
} from '../../../project-shared/spaced-repetition'

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

export const spacedRepetitionScheduler = new SpacedRepetitionScheduler(spacedRepetitionConfig)

export const createInitialReviewState = (initialDue?: string | Date): ReviewState => {
  const interval = spacedRepetitionScheduler.getInitialIntervalSeconds()
  const due = initialDue ? new Date(initialDue) : new Date()
  return {
    easeFactor: spacedRepetitionConfig.initialEaseFactor,
    interval,
    repetitions: 0,
    nextReviewDate: due.toISOString(),
    lastReviewedAt: null,
  }
}
