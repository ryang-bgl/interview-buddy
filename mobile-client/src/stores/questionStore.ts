import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiClient } from "@/services/api";
import {
  DsaQuestion,
  QuestionReminder,
  QuestionReviewState,
} from "@/types/question";
import { spacedRepetitionScheduler } from "@/utils/spacedRepetitionScheduler";
import { ReviewDifficulty } from "@/config/spacedRepetition";

export interface QuestionState {
  questions: DsaQuestion[];
  reviewStates: Record<string, QuestionReviewState>;
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  hasAttemptedInitialSync: boolean;

  loadQuestions: () => Promise<void>;
  refreshQuestions: () => Promise<void>;
  reviewQuestion: (questionId: string, difficulty: ReviewDifficulty) => void;
  getDueQuestions: () => QuestionReminder[];
  getAllReminders: () => QuestionReminder[];
  clearError: () => void;
}

const createInitialReviewState = (initialDue?: string | Date | null): QuestionReviewState => {
  const initialInterval = spacedRepetitionScheduler.getInitialIntervalSeconds();
  let nextReviewDate = new Date();
  if (initialDue) {
    const parsed = typeof initialDue === "string" ? new Date(initialDue) : new Date(initialDue);
    if (!Number.isNaN(parsed.getTime())) {
      nextReviewDate = parsed;
    } else {
      nextReviewDate.setSeconds(nextReviewDate.getSeconds() + initialInterval);
    }
  } else {
    nextReviewDate.setSeconds(nextReviewDate.getSeconds() + initialInterval);
  }

  return {
    easeFactor: 2.5,
    interval: initialInterval,
    repetitions: 0,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewedAt: null,
  };
};

const calculateNextState = (
  current: QuestionReviewState,
  difficulty: ReviewDifficulty
): QuestionReviewState => {
  const result = spacedRepetitionScheduler.schedule(current, difficulty);

  return {
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    lastReviewedAt: result.lastReviewedAt.toISOString(),
    nextReviewDate: result.nextReviewDate.toISOString(),
  };
};

const buildReviewStateFromQuestion = (question: DsaQuestion): QuestionReviewState => {
  const base = createInitialReviewState(
    question.nextReviewDate ?? question.lastReviewedAt ?? null
  );
  return {
    easeFactor: question.reviewEaseFactor ?? base.easeFactor,
    interval: question.reviewIntervalSeconds ?? base.interval,
    repetitions: question.reviewRepetitions ?? base.repetitions,
    nextReviewDate: question.nextReviewDate ?? base.nextReviewDate,
    lastReviewedAt: question.lastReviewedAt ?? base.lastReviewedAt,
  };
};

const mapToReminder = (
  question: DsaQuestion,
  state: QuestionReviewState | undefined
): QuestionReminder => ({
  ...question,
  ...(state ?? createInitialReviewState()),
});

const getQuestionKey = (question: DsaQuestion) =>
  question.questionIndex || question.id;

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      questions: [],
      reviewStates: {},
      isLoading: false,
      error: null,
      lastSyncedAt: null,
      hasAttemptedInitialSync: false,

      loadQuestions: async () => {
        if (get().isLoading) {
          return;
        }

        set({ isLoading: true, error: null, hasAttemptedInitialSync: true });

        try {
          const response = await apiClient.getQuestions();
          if (!response.success || !response.data) {
            throw new Error(response.error || "Failed to load questions");
          }

          const questions = response.data.map((question) => ({
            ...question,
            questionIndex: question.questionIndex || question.id,
          }));

          const reviewStates = { ...get().reviewStates };
          const validKeys = new Set<string>();
          questions.forEach((question) => {
            const key = getQuestionKey(question);
            validKeys.add(key);
            reviewStates[key] = buildReviewStateFromQuestion(question);
          });
          Object.keys(reviewStates).forEach((key) => {
            if (!validKeys.has(key)) {
              delete reviewStates[key];
            }
          });

          set({
            questions,
            reviewStates,
            isLoading: false,
            error: null,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error: any) {
          console.error("Failed to load questions", error);
          set({
            isLoading: false,
            error: error?.message || "Unable to load questions",
          });
        }
      },

      refreshQuestions: async () => {
        await get().loadQuestions();
      },

      reviewQuestion: (questionId, difficulty) => {
        const reviewStates = { ...get().reviewStates };
        const currentQuestions = get().questions;
        const matchedQuestion = currentQuestions.find(
          (question) =>
            question.questionIndex === questionId || question.id === questionId
        );
        const stateKey = matchedQuestion?.questionIndex || questionId;
        const current = reviewStates[stateKey] ?? createInitialReviewState();
        const nextState = calculateNextState(current, difficulty);
        reviewStates[stateKey] = nextState;

        let updatedQuestions = currentQuestions;
        let questionIndexValue = stateKey;
        const targetIdx = matchedQuestion
          ? currentQuestions.findIndex(
              (question) =>
                question.questionIndex === matchedQuestion.questionIndex
            )
          : -1;
        if (targetIdx >= 0) {
          const updatedQuestion = {
            ...currentQuestions[targetIdx],
            lastReviewedAt: nextState.lastReviewedAt,
            lastReviewStatus: difficulty,
            reviewIntervalSeconds: nextState.interval,
            reviewEaseFactor: nextState.easeFactor,
            reviewRepetitions: nextState.repetitions,
            nextReviewDate: nextState.nextReviewDate,
          };
          updatedQuestions = [...currentQuestions];
          updatedQuestions[targetIdx] = updatedQuestion;
          questionIndexValue = updatedQuestion.questionIndex;
        }

        set({ reviewStates, questions: updatedQuestions });

        apiClient
          .updateQuestionReview(questionIndexValue, {
            lastReviewedAt:
              nextState.lastReviewedAt ?? new Date().toISOString(),
            lastReviewStatus: difficulty,
            nextReviewDate: nextState.nextReviewDate,
            reviewIntervalSeconds: nextState.interval,
            reviewEaseFactor: nextState.easeFactor,
            reviewRepetitions: nextState.repetitions,
          })
          .catch((error) => {
            console.warn("Failed to sync question review timestamp", error);
          });
      },

      getDueQuestions: () => {
        const now = Date.now();
        return get()
          .getAllReminders()
          .filter(
            (reminder) => new Date(reminder.nextReviewDate).getTime() <= now
          )
          .sort(
            (a, b) =>
              new Date(a.nextReviewDate).getTime() -
              new Date(b.nextReviewDate).getTime()
          );
      },

      getAllReminders: () => {
        const { questions, reviewStates } = get();
        return questions.map((question) =>
          mapToReminder(question, reviewStates[getQuestionKey(question)])
        );
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "question-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        questions: state.questions,
        reviewStates: state.reviewStates,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
