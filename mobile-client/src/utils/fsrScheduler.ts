import AsyncStorage from "@react-native-async-storage/async-storage";
import { LeetCodeSolution, ReviewSession } from "@/types/solution";

const SOLUTIONS_KEY = "leetcode_solutions";
const REVIEW_SESSIONS_KEY = "review_sessions";

// FSR (Spaced Repetition) Algorithm based on SuperMemo SM-2
export class FSRScheduler {
  // Initial ease factor
  private static readonly INITIAL_EASE_FACTOR = 2.5;

  // Minimum ease factor
  private static readonly MIN_EASE_FACTOR = 1.3;

  /**
   * Calculate next review date based on FSR algorithm
   * @param solution Current solution data
   * @param difficulty User's self-assessment of recall difficulty
   * @returns Updated solution with new scheduling parameters
   */
  static calculateNextReview(
    solution: LeetCodeSolution,
    difficulty: "easy" | "good" | "hard"
  ): LeetCodeSolution {
    let { easeFactor, interval, repetitions } = solution;
    const now = new Date();

    // Convert difficulty to quality (0-5 scale used in SM-2)
    let quality: number;
    switch (difficulty) {
      case "hard":
        quality = 1; // Incorrect response; correct on second attempt
        break;
      case "good":
        quality = 3; // Correct response with serious difficulty
        break;
      case "easy":
        quality = 5; // Perfect response
        break;
    }

    // If quality < 3, restart the learning process
    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      // Calculate new ease factor
      easeFactor = Math.max(
        this.MIN_EASE_FACTOR,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      // Calculate new interval
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      repetitions += 1;
    }

    // Calculate next review date
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      ...solution,
      easeFactor,
      interval,
      repetitions,
      nextReviewDate,
      lastReviewedAt: now,
      updatedAt: now,
    };
  }
}

/**
 * Get all solutions stored locally
 */
export async function getAllSolutions(): Promise<LeetCodeSolution[]> {
  try {
    const data = await AsyncStorage.getItem(SOLUTIONS_KEY);
    if (!data) return [];

    const solutions = JSON.parse(data);
    return solutions.map((solution: any) => ({
      ...solution,
      nextReviewDate: new Date(solution.nextReviewDate),
      lastReviewedAt: solution.lastReviewedAt
        ? new Date(solution.lastReviewedAt)
        : undefined,
      createdAt: new Date(solution.createdAt),
      updatedAt: new Date(solution.updatedAt),
    }));
  } catch (error) {
    console.error("Error loading solutions:", error);
    return [];
  }
}

/**
 * Save solutions to local storage
 */
export async function saveSolutions(
  solutions: LeetCodeSolution[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(SOLUTIONS_KEY, JSON.stringify(solutions));
  } catch (error) {
    console.error("Error saving solutions:", error);
    throw error;
  }
}

/**
 * Get solutions that are due for review
 */
export async function getSolutionsDueForReview(): Promise<LeetCodeSolution[]> {
  const solutions = await getAllSolutions();
  const now = new Date();

  return solutions
    .filter((solution) => solution.nextReviewDate <= now)
    .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
}

/**
 * Mark a solution as reviewed and update its schedule
 */
export async function markSolutionReviewed(
  solutionId: string,
  difficulty: "easy" | "good" | "hard"
): Promise<void> {
  const solutions = await getAllSolutions();
  const solutionIndex = solutions.findIndex((s) => s.id === solutionId);

  if (solutionIndex === -1) {
    throw new Error("Solution not found");
  }

  // Update the solution with new FSR parameters
  solutions[solutionIndex] = FSRScheduler.calculateNextReview(
    solutions[solutionIndex],
    difficulty
  );

  // Save updated solutions
  await saveSolutions(solutions);

  // Record the review session
  await recordReviewSession({
    solutionId,
    reviewedAt: new Date(),
    difficulty,
  });
}

/**
 * Add a new solution
 */
export async function addSolution(
  solution: Omit<
    LeetCodeSolution,
    | "id"
    | "easeFactor"
    | "interval"
    | "repetitions"
    | "nextReviewDate"
    | "createdAt"
    | "updatedAt"
  >
): Promise<void> {
  const solutions = await getAllSolutions();
  const now = new Date();
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + 1); // First review tomorrow

  const newSolution: LeetCodeSolution = {
    ...solution,
    id: Date.now().toString(),
    easeFactor: FSRScheduler["INITIAL_EASE_FACTOR"],
    interval: 1,
    repetitions: 0,
    nextReviewDate,
    createdAt: now,
    updatedAt: now,
  };

  solutions.push(newSolution);
  await saveSolutions(solutions);
}

/**
 * Record a review session
 */
async function recordReviewSession(session: ReviewSession): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(REVIEW_SESSIONS_KEY);
    const sessions: ReviewSession[] = data ? JSON.parse(data) : [];

    sessions.push(session);

    // Keep only last 1000 sessions to prevent storage bloat
    if (sessions.length > 1000) {
      sessions.splice(0, sessions.length - 1000);
    }

    await AsyncStorage.setItem(REVIEW_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error recording review session:", error);
  }
}

/**
 * Get review sessions for analytics
 */
export async function getReviewSessions(): Promise<ReviewSession[]> {
  try {
    const data = await AsyncStorage.getItem(REVIEW_SESSIONS_KEY);
    if (!data) return [];

    const sessions = JSON.parse(data);
    return sessions.map((session: any) => ({
      ...session,
      reviewedAt: new Date(session.reviewedAt),
    }));
  } catch (error) {
    console.error("Error loading review sessions:", error);
    return [];
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const solutions = await getAllSolutions();
  const sessions = await getReviewSessions();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate streak
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const reviewsOnDay = sessions.filter(
      (session) => session.reviewedAt >= dayStart && session.reviewedAt < dayEnd
    );

    if (reviewsOnDay.length > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  const averageEaseFactor =
    solutions.length > 0
      ? solutions.reduce((sum, s) => sum + s.easeFactor, 0) / solutions.length
      : FSRScheduler["INITIAL_EASE_FACTOR"];

  const lastReviewDate =
    sessions.length > 0 ? sessions[sessions.length - 1].reviewedAt : undefined;

  return {
    totalSolutions: solutions.length,
    totalReviews: sessions.length,
    streak,
    lastReviewDate,
    averageEaseFactor,
  };
}
