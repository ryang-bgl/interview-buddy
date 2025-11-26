import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/services/api';
import {
  FlashcardCardRecord,
  FlashcardNoteRecord,
  FlashcardNoteSummary,
} from '@/types/flashcard';
import { spacedRepetitionScheduler } from '@/utils/spacedRepetitionScheduler';
import { ReviewDifficulty } from '@/config/spacedRepetition';

export interface FlashcardReviewState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
}

export interface FlashcardReminder extends FlashcardReviewState {
  noteId: string;
  cardId: string;
  front: string;
  back: string;
  extra?: string | null;
  tags?: string[];
  topic: string | null;
  summary: string | null;
  url: string;
}

interface FlashcardStoreState {
  notes: FlashcardNoteRecord[];
  summaries: FlashcardNoteSummary[];
  reviewNoteIds: string[];
  reviewStates: Record<string, FlashcardReviewState>;
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
  loadNotes: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  reviewCard: (noteId: string, cardId: string, difficulty: ReviewDifficulty) => void;
  getAllReminders: () => FlashcardReminder[];
  getDueCards: () => FlashcardReminder[];
  clearError: () => void;
  toggleReviewNote: (noteId: string) => void;
}

const createInitialReviewState = (): FlashcardReviewState => {
  const interval = spacedRepetitionScheduler.getInitialIntervalSeconds();
  const nextReviewDate = new Date(Date.now() + interval * 1000);
  return {
    easeFactor: 2.5,
    interval,
    repetitions: 0,
    nextReviewDate: nextReviewDate.toISOString(),
  };
};

const buildCardKey = (noteId: string, cardId: string) => `${noteId}::${cardId}`;

const ensureCardId = (card: FlashcardCardRecord, index: number) => ({
  ...card,
  id: card.id ?? `card-${index}`,
});

const normalizeNote = (note: FlashcardNoteRecord): FlashcardNoteRecord => ({
  ...note,
  topic: note.topic ?? null,
  summary: note.summary ?? null,
  lastReviewedAt: note.lastReviewedAt ?? null,
  lastReviewStatus: note.lastReviewStatus ?? null,
  cards: (note.cards ?? []).map((card, index) => ensureCardId(card, index)),
});

export const useFlashcardStore = create<FlashcardStoreState>()(
  persist(
    (set, get) => ({
      notes: [],
      summaries: [],
      reviewNoteIds: [],
      reviewStates: {},
      isLoading: false,
      error: null,
      lastUpdatedAt: null,

      loadNotes: async () => {
        if (get().isLoading) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.listGeneralNotes();
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to load flashcards');
          }

          const summaries = response.data.notes.map(summary => ({
            ...summary,
            tags: summary.tags ?? [],
          }));
          const detailedNotes = await loadDetailedNotes(summaries);
          const normalizedNotes = detailedNotes.map(normalizeNote);
          const reviewStates = { ...get().reviewStates };
          const existingSelection = get().reviewNoteIds;
          const summaryIdSet = new Set(summaries.map(summary => summary.noteId));
          let reviewNoteIds = existingSelection.filter(id => summaryIdSet.has(id));
          if (!reviewNoteIds.length) {
            reviewNoteIds = summaries.map(summary => summary.noteId);
          }

          normalizedNotes.forEach(note => {
            note.cards.forEach(card => {
              const key = buildCardKey(note.noteId, card.id!);
              if (!reviewStates[key]) {
                reviewStates[key] = createInitialReviewState();
              }
            });
          });

          set({
            notes: normalizedNotes,
            summaries,
            reviewNoteIds,
            reviewStates,
            isLoading: false,
            error: null,
            lastUpdatedAt: new Date().toISOString(),
          });
        } catch (error: any) {
          console.error('Failed to load flashcards', error);
          set({
            isLoading: false,
            error: error?.message || 'Unable to load flashcards',
          });
        }
      },

      refreshNotes: async () => {
        await get().loadNotes();
      },

      reviewCard: (noteId, cardId, difficulty) => {
        const reviewStates = { ...get().reviewStates };
        const key = buildCardKey(noteId, cardId);
        const currentState = reviewStates[key] ?? createInitialReviewState();
        const nextState = spacedRepetitionScheduler.schedule(currentState, difficulty);
        reviewStates[key] = {
          easeFactor: nextState.easeFactor,
          interval: nextState.interval,
          repetitions: nextState.repetitions,
          lastReviewedAt: nextState.lastReviewedAt.toISOString(),
          nextReviewDate: nextState.nextReviewDate.toISOString(),
        };

        const nowIso = nextState.lastReviewedAt.toISOString();
        const notes = get().notes.map(note => {
          if (note.noteId !== noteId) {
            return note;
          }
          return {
            ...note,
            lastReviewedAt: nowIso,
            lastReviewStatus: difficulty,
          };
        });

        set({ reviewStates, notes });
      },

      getAllReminders: () => {
        const { notes, reviewStates, reviewNoteIds } = get();
        const allowed = new Set(reviewNoteIds);
        const reminders: FlashcardReminder[] = [];
        notes.forEach(note => {
          if (!allowed.has(note.noteId)) {
            return;
          }
          note.cards.forEach(card => {
            const cardId = card.id!;
            const key = buildCardKey(note.noteId, cardId);
            const state = reviewStates[key] ?? createInitialReviewState();
            reminders.push({
              noteId: note.noteId,
              cardId,
              front: card.front,
              back: card.back,
              extra: card.extra,
              tags: card.tags,
              topic: note.topic,
              summary: note.summary,
              url: note.url,
              ...state,
            });
          });
        });
        return reminders;
      },

      getDueCards: () => {
        return get()
          .getAllReminders()
          .filter(reminder => new Date(reminder.nextReviewDate).getTime() <= Date.now())
          .sort(
            (a, b) =>
              new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
          );
      },

      clearError: () => set({ error: null }),

      toggleReviewNote: (noteId) => {
        set(state => {
          const exists = state.reviewNoteIds.includes(noteId);
          const reviewNoteIds = exists
            ? state.reviewNoteIds.filter(id => id !== noteId)
            : [...state.reviewNoteIds, noteId];
          return { reviewNoteIds };
        });
      },
    }),
    {
      name: 'flashcard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        notes: state.notes,
        summaries: state.summaries,
        reviewNoteIds: state.reviewNoteIds,
        reviewStates: state.reviewStates,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
    }
  )
);

async function loadDetailedNotes(
  summaries: FlashcardNoteSummary[]
): Promise<FlashcardNoteRecord[]> {
  const detailed = await Promise.all(
    summaries.map(async summary => {
      try {
        const detailResponse = await apiClient.getGeneralNoteByUrl(summary.url);
        if (!detailResponse.success || !detailResponse.data) {
          console.warn('Failed to load note detail', summary.url, detailResponse.error);
          return null;
        }
        return detailResponse.data;
      } catch (error) {
        console.warn('Error loading note detail', summary.url, error);
        return null;
      }
    })
  );

  return detailed.filter((note): note is FlashcardNoteRecord => Boolean(note));
}
