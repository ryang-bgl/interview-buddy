import Constants from 'expo-constants';

export type ReviewDifficulty = 'easy' | 'medium' | 'hard';

export interface SpacedRepetitionConfig {
  /** Durations for each spaced-repetition stage in seconds */
  patternSeconds: number[];
  /** How many stages to move forward when marking "easy" */
  easyStep: number;
  /** How many stages to move backward when marking "medium" */
  mediumStep: number;
}

const SECONDS_PER_DAY = 60 * 60 * 24;
const DEFAULT_PATTERN_SECONDS = [
  SECONDS_PER_DAY, // 1d
  3 * SECONDS_PER_DAY, // 3d
  7 * SECONDS_PER_DAY, // 1w
  14 * SECONDS_PER_DAY, // 2w
  30 * SECONDS_PER_DAY, // 1m
];

const DEV_PATTERN_SECONDS = [20, 60, 180];

const parsePattern = (value?: string | number[] | null): number[] | null => {
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

const getPatternFromEnv = (): number[] | null => {
  const envValue = process.env.EXPO_PUBLIC_SR_PATTERN_SECONDS;
  const parsedEnv = parsePattern(envValue ?? null);
  if (parsedEnv) {
    return parsedEnv;
  }

  const extra = Constants.expoConfig?.extra as
    | { spacedRepetitionPattern?: number[] | string }
    | undefined;
  return parsePattern(extra?.spacedRepetitionPattern ?? null);
};

const resolvedPattern =
  getPatternFromEnv() ?? (__DEV__ ? DEV_PATTERN_SECONDS : DEFAULT_PATTERN_SECONDS);

export const spacedRepetitionConfig: SpacedRepetitionConfig = {
  patternSeconds: resolvedPattern,
  easyStep: 1,
  mediumStep: 1,
};
