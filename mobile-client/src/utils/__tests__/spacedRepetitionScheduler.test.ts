import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SpacedRepetitionScheduler } from '@/utils/spacedRepetitionScheduler';
import type { SpacedRepetitionConfig } from '@/config/spacedRepetition';

const testConfig: SpacedRepetitionConfig = {
  patternSeconds: [20, 60, 180],
  easyStep: 1,
  mediumStep: 1,
};

const scheduler = new SpacedRepetitionScheduler(testConfig);

describe('SpacedRepetitionScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the first interval for initial state helpers', () => {
    expect(scheduler.getInitialIntervalSeconds()).toBe(20);
  });

  it('advances to the next stage for easy reviews', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.5,
        repetitions: 0,
        interval: 20,
      },
      'easy'
    );

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(60);
    expect(result.nextReviewDate.getTime() - result.lastReviewedAt.getTime()).toBe(60_000);
  });

  it('moves backwards for medium reviews but never below first stage', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.5,
        repetitions: 0,
        interval: 20,
      },
      'medium'
    );

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(20);
  });

  it('resets to stage zero for hard reviews and decreases ease factor', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.0,
        repetitions: 2,
        interval: 180,
      },
      'hard'
    );

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(20);
    expect(result.easeFactor).toBeLessThan(2);
  });

  it('clamps to the highest available stage when already at the end', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.5,
        repetitions: 2,
        interval: 180,
      },
      'easy'
    );

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(180);
  });
});
