import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  SpacedRepetitionScheduler,
  type SpacedRepetitionConfig,
} from "../../../project-shared/spaced-repetition";

describe("SpacedRepetitionScheduler", () => {
  const config: SpacedRepetitionConfig = {
    learningStepsSeconds: [60, 120],
    easyBonus: 1.3,
    daySeconds: 60 * 60 * 24,
    initialEaseFactor: 2.5,
    minEaseFactor: 1.3,
  };
  const scheduler = new SpacedRepetitionScheduler(config);

  const now = new Date("2024-01-01T00:00:00.000Z");
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("keeps a card in the first learning step initially", () => {
    const result = scheduler.schedule(undefined, "good");
    expect(result.interval).toBe(config.learningStepsSeconds[0]);
    expect(result.repetitions).toBe(1);
    expect(result.nextReviewDate.toISOString()).toBe(
      new Date(now.getTime() + 60 * 1000).toISOString()
    );
  });

  it("resets to the first step when rating hard", () => {
    const snapshot = { easeFactor: 2.5, interval: 120, repetitions: 2 };
    const result = scheduler.schedule(snapshot, "hard");
    expect(result.interval).toBe(config.learningStepsSeconds[0]);
    expect(result.repetitions).toBe(0);
  });

  it("graduates to day-based intervals after learning steps", () => {
    const snapshot = {
      easeFactor: 2.5,
      interval: 120,
      repetitions: config.learningStepsSeconds.length,
    };
    const result = scheduler.schedule(snapshot, "good");
    expect(result.interval).toBeGreaterThan(
      config.learningStepsSeconds.at(-1) ?? 0
    );
    expect(result.interval).toBe(config.daySeconds * Math.round(2.5));
  });
});
