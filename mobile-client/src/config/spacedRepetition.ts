import Constants from 'expo-constants';

export type ReviewDifficulty = 'easy' | 'good' | 'hard';

export interface SpacedRepetitionConfig {
  learningStepsSeconds: number[];
  easyBonus: number;
  daySeconds: number;
  initialEaseFactor: number;
  minEaseFactor: number;
}

const SECONDS_PER_DAY = 60 * 60 * 24;
const DEV_LEARNING_STEPS = [20, 60, 180];
const DEFAULT_LEARNING_STEPS = [SECONDS_PER_DAY, 3 * SECONDS_PER_DAY];

const parseSteps = (value?: string | number[] | null): number[] | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const parsed = value
      .map(item => Number(item))
      .filter(duration => Number.isFinite(duration) && duration > 0);
    return parsed.length ? parsed : null;
  }

  const parsed = value
    .split(',')
    .map(part => Number(part.trim()))
    .filter(duration => Number.isFinite(duration) && duration > 0);
  return parsed.length ? parsed : null;
};

const getStepsFromEnv = (): number[] | null => {
  const envValue = process.env.EXPO_PUBLIC_SR_LEARNING_STEPS;
  const parsed = parseSteps(envValue ?? null);
  if (parsed) {
    return parsed;
  }

  const extra = Constants.expoConfig?.extra as
    | { spacedRepetitionLearningSteps?: number[] | string }
    | undefined;
  return parseSteps(extra?.spacedRepetitionLearningSteps ?? null);
};

const resolvedSteps = getStepsFromEnv() ?? (__DEV__ ? DEV_LEARNING_STEPS : DEFAULT_LEARNING_STEPS);

export const spacedRepetitionConfig: SpacedRepetitionConfig = {
  learningStepsSeconds: resolvedSteps,
  easyBonus: 1.3,
  daySeconds: SECONDS_PER_DAY,
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
};
