import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/services/api';
import { DsaQuestion, QuestionReminder, QuestionReviewState } from '@/types/question';
import { spacedRepetitionScheduler } from '@/utils/spacedRepetitionScheduler';

export interface QuestionState {
  questions: DsaQuestion[];
  reviewStates: Record<string, QuestionReviewState>;
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  hasAttemptedInitialSync: boolean;

  loadQuestions: () => Promise<void>;
  refreshQuestions: () => Promise<void>;
  reviewQuestion: (questionId: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  getDueQuestions: () => QuestionReminder[];
  getAllReminders: () => QuestionReminder[];
  clearError: () => void;
}

const createInitialReviewState = (): QuestionReviewState => {
  const initialInterval = spacedRepetitionScheduler.getInitialIntervalSeconds();
  const nextReviewDate = new Date();
  nextReviewDate.setSeconds(nextReviewDate.getSeconds() + initialInterval);

  return {
    easeFactor: 2.5,
    interval: initialInterval,
    repetitions: 0,
    nextReviewDate: nextReviewDate.toISOString(),
  };
};

const calculateNextState = (
  current: QuestionReviewState,
  difficulty: 'easy' | 'medium' | 'hard'
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

const mapToReminder = (
  question: DsaQuestion,
  state: QuestionReviewState | undefined
): QuestionReminder => ({
  ...question,
  ...(state ?? createInitialReviewState()),
});

const getQuestionKey = (question: DsaQuestion) => question.id || question.questionIndex;

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
            throw new Error(response.error || 'Failed to load questions');
          }

          const questions = response.data.map((question) => ({
            ...question,
            questionIndex: question.questionIndex || question.id,
          }));

          const reviewStates = { ...get().reviewStates };
          questions.forEach((question) => {
            const key = getQuestionKey(question);
            if (!reviewStates[key]) {
              reviewStates[key] = createInitialReviewState();
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
          console.error('Failed to load questions', error);
          set({
            isLoading: false,
            error: error?.message || 'Unable to load questions',
          });
        }
      },

      refreshQuestions: async () => {
        await get().loadQuestions();
      },

      reviewQuestion: (questionId, difficulty) => {
        const reviewStates = { ...get().reviewStates };
        const current = reviewStates[questionId] ?? createInitialReviewState();
        const nextState = calculateNextState(current, difficulty);
        reviewStates[questionId] = nextState;

        set({ reviewStates });
      },

      getDueQuestions: () => {
        const now = Date.now();
        return get()
          .getAllReminders()
          .filter(reminder => new Date(reminder.nextReviewDate).getTime() <= now)
          .sort(
            (a, b) =>
              new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
          );
      },

      getAllReminders: () => {
        const { questions, reviewStates } = get();
        return questions.map(question => mapToReminder(question, reviewStates[getQuestionKey(question)]));
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'question-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        questions: state.questions,
        reviewStates: state.reviewStates,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
