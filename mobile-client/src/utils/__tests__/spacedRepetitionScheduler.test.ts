import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SpacedRepetitionScheduler } from '@/utils/spacedRepetitionScheduler';
import type { SpacedRepetitionConfig } from '@/config/spacedRepetition';

const testConfig: SpacedRepetitionConfig = {
  learningStepsSeconds: [20, 60],
  easyBonus: 1.4,
  daySeconds: 86_400,
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
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

  it('schedules first learning step for the initial good review', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.5,
        repetitions: 0,
        interval: 20,
      },
      'good'
    );

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(20);
  });

  it('moves to the next learning step after the first success', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.5,
        repetitions: 1,
        interval: 20,
      },
      'good'
    );

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(60);
  });

  it('resets to first step on hard (again)', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.0,
        repetitions: 3,
        interval: 1_000,
      },
      'hard'
    );

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(20);
    expect(result.easeFactor).toBeLessThan(2);
  });

  it('extends interval using SM-2 style growth for easy answers', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.4,
        repetitions: 5,
        interval: 86_400 * 6,
      },
      'easy'
    );

    expect(result.interval).toBeGreaterThan(86_400 * 6);
    expect(result.repetitions).toBe(6);
  });

  it('increases interval steadily for good answers', () => {
    const result = scheduler.schedule(
      {
        easeFactor: 2.3,
        repetitions: 4,
        interval: 86_400 * 10,
      },
      'good'
    );

    expect(result.interval).toBeGreaterThan(86_400 * 10);
    expect(result.repetitions).toBe(5);
  });
});
