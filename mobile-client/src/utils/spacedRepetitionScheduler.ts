import { spacedRepetitionConfig } from '@/config/spacedRepetition';
import {
  SpacedRepetitionScheduler,
  type ReviewDifficulty,
  type SpacedRepetitionResult,
  type SpacedRepetitionSnapshot,
} from '../../../project-shared/spaced-repetition';

export type { SpacedRepetitionSnapshot, SpacedRepetitionResult, ReviewDifficulty };
export { SpacedRepetitionScheduler };

export const spacedRepetitionScheduler = new SpacedRepetitionScheduler(spacedRepetitionConfig);
