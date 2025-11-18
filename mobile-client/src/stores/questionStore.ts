import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/services/api';
import { DsaQuestion, QuestionReminder, QuestionReviewState } from '@/types/question';

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

const createInitialReviewState = (): QuestionReviewState => ({
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
  nextReviewDate: new Date().toISOString(),
});

const calculateNextState = (
  current: QuestionReviewState,
  difficulty: 'easy' | 'medium' | 'hard'
): QuestionReviewState => {
  let easeFactor = current.easeFactor;
  let interval = current.interval;
  let repetitions = current.repetitions;

  switch (difficulty) {
    case 'easy':
      easeFactor = Math.max(1.3, easeFactor + 0.1);
      repetitions += 1;
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * easeFactor);
      break;
    case 'medium':
      repetitions = Math.max(1, repetitions + 1);
      interval = Math.max(1, Math.round(interval * 0.9));
      break;
    case 'hard':
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      repetitions = 0;
      interval = 1;
      break;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + Math.max(1, interval));

  return {
    easeFactor,
    interval,
    repetitions,
    lastReviewedAt: new Date().toISOString(),
    nextReviewDate: nextReviewDate.toISOString(),
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
