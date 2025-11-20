import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeetCodeSolution, UserStats, ReviewSession } from '@/types/solution';
import { apiClient } from '@/services/api';
import { spacedRepetitionScheduler } from '@/utils/spacedRepetitionScheduler';

export interface SolutionState {
  // State
  solutions: LeetCodeSolution[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: Date | null;

  // Actions
  loadSolutions: () => Promise<void>;
  addSolution: (solution: Omit<LeetCodeSolution, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateSolution: (id: string, updates: Partial<LeetCodeSolution>) => Promise<boolean>;
  deleteSolution: (id: string) => Promise<boolean>;
  reviewSolution: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  syncSolutions: () => Promise<void>;
  loadUserStats: () => Promise<void>;
  clearError: () => void;

  // Local-only actions (for offline use)
  addSolutionLocally: (solution: LeetCodeSolution) => void;
  updateSolutionLocally: (id: string, updates: Partial<LeetCodeSolution>) => void;
  deleteSolutionLocally: (id: string) => void;

  // Computed getters
  getDueForReview: () => LeetCodeSolution[];
  getSolutionsByDifficulty: (difficulty: 'Easy' | 'Medium' | 'Hard') => LeetCodeSolution[];
  getSolutionsByTag: (tag: string) => LeetCodeSolution[];
}

export const useSolutionStore = create<SolutionState>()(
  persist(
    (set, get) => ({
      // Initial state
      solutions: [],
      userStats: null,
      isLoading: false,
      error: null,
      syncStatus: 'idle',
      lastSyncTime: null,

      // Actions
      loadSolutions: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.getSolutions();

          if (response.success && response.data) {
            set({
              solutions: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to load solutions',
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Network error. Using cached solutions.',
          });
        }
      },

      addSolution: async (solutionData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.createSolution(solutionData);

          if (response.success && response.data) {
            const currentSolutions = get().solutions;
            set({
              solutions: [...currentSolutions, response.data],
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to add solution',
            });
            return false;
          }
        } catch (error) {
          // Add locally for offline support
          const newSolution: LeetCodeSolution = {
            ...solutionData,
            id: `local-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const currentSolutions = get().solutions;
          set({
            solutions: [...currentSolutions, newSolution],
            isLoading: false,
            error: 'Added locally. Will sync when online.',
          });
          return true;
        }
      },

      updateSolution: async (id, updates) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.updateSolution(id, updates);

          if (response.success && response.data) {
            const currentSolutions = get().solutions;
            const updatedSolutions = currentSolutions.map(solution =>
              solution.id === id ? response.data! : solution
            );

            set({
              solutions: updatedSolutions,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to update solution',
            });
            return false;
          }
        } catch (error) {
          // Update locally for offline support
          get().updateSolutionLocally(id, updates);
          set({
            isLoading: false,
            error: 'Updated locally. Will sync when online.',
          });
          return true;
        }
      },

      deleteSolution: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.deleteSolution(id);

          if (response.success) {
            const currentSolutions = get().solutions;
            const filteredSolutions = currentSolutions.filter(solution => solution.id !== id);

            set({
              solutions: filteredSolutions,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to delete solution',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Network error. Cannot delete solution.',
          });
          return false;
        }
      },

      reviewSolution: (id, difficulty) => {
        const solutions = get().solutions;
        const solution = solutions.find(s => s.id === id);

        if (!solution) return;

        const result = spacedRepetitionScheduler.schedule(
          {
            easeFactor: solution.easeFactor,
            repetitions: solution.repetitions,
            interval: solution.interval,
          },
          difficulty
        );

        const updatedSolution = {
          ...solution,
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          nextReviewDate: result.nextReviewDate,
          lastReviewedAt: result.lastReviewedAt,
          updatedAt: result.lastReviewedAt,
        };

        // Update locally immediately
        get().updateSolutionLocally(id, updatedSolution);

        // Try to sync with server in background
        get().updateSolution(id, updatedSolution);
      },

      syncSolutions: async () => {
        set({ syncStatus: 'syncing', error: null });

        try {
          const currentSolutions = get().solutions;
          const response = await apiClient.syncSolutions({
            solutions: currentSolutions,
            lastSyncTime: get().lastSyncTime || undefined,
          });

          if (response.success && response.data) {
            set({
              solutions: response.data.solutions,
              syncStatus: 'success',
              lastSyncTime: response.data.lastSyncTime,
              error: null,
            });
          } else {
            set({
              syncStatus: 'error',
              error: response.error || 'Sync failed',
            });
          }
        } catch (error) {
          set({
            syncStatus: 'error',
            error: 'Network error during sync',
          });
        }
      },

      loadUserStats: async () => {
        try {
          const response = await apiClient.getUserStats();

          if (response.success && response.data) {
            set({ userStats: response.data });
          }
        } catch (error) {
          console.warn('Failed to load user stats');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Local-only actions
      addSolutionLocally: (solution) => {
        const currentSolutions = get().solutions;
        set({ solutions: [...currentSolutions, solution] });
      },

      updateSolutionLocally: (id, updates) => {
        const currentSolutions = get().solutions;
        const updatedSolutions = currentSolutions.map(solution =>
          solution.id === id
            ? { ...solution, ...updates, updatedAt: new Date() }
            : solution
        );
        set({ solutions: updatedSolutions });
      },

      deleteSolutionLocally: (id) => {
        const currentSolutions = get().solutions;
        const filteredSolutions = currentSolutions.filter(solution => solution.id !== id);
        set({ solutions: filteredSolutions });
      },

      // Computed getters
      getDueForReview: () => {
        const now = new Date();
        return get().solutions.filter(solution =>
          new Date(solution.nextReviewDate) <= now
        );
      },

      getSolutionsByDifficulty: (difficulty) => {
        return get().solutions.filter(solution => solution.difficulty === difficulty);
      },

      getSolutionsByTag: (tag) => {
        return get().solutions.filter(solution =>
          solution.tags.includes(tag)
        );
      },
    }),
    {
      name: 'solution-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        solutions: state.solutions,
        userStats: state.userStats,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
