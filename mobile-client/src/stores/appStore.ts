import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    reviewReminders: boolean;
    dailyGoals: boolean;
    weeklyReports: boolean;
  };
  review: {
    showHints: boolean;
    autoAdvance: boolean;
    dailyGoal: number;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number; // in minutes
  };
}

export interface AppState {
  // State
  settings: AppSettings;
  isOnline: boolean;
  lastActiveDate: Date | null;
  currentStreak: number;
  isFirstLaunch: boolean;

  // UI State
  activeTab: string;
  isDrawerOpen: boolean;
  notification: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;

  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updateStreak: () => void;
  setActiveTab: (tab: string) => void;
  toggleDrawer: () => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideNotification: () => void;
  markFirstLaunchComplete: () => void;
  resetApp: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notifications: {
    reviewReminders: true,
    dailyGoals: true,
    weeklyReports: false,
  },
  review: {
    showHints: true,
    autoAdvance: false,
    dailyGoal: 5,
  },
  sync: {
    autoSync: true,
    syncInterval: 30,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      isOnline: true,
      lastActiveDate: null,
      currentStreak: 0,
      isFirstLaunch: true,

      // UI State
      activeTab: 'index',
      isDrawerOpen: false,
      notification: null,

      // Actions
      updateSettings: (newSettings) => {
        const currentSettings = get().settings;
        set({
          settings: { ...currentSettings, ...newSettings },
        });
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      updateStreak: () => {
        const today = new Date();
        const lastActive = get().lastActiveDate;

        if (!lastActive) {
          // First time user
          set({
            currentStreak: 1,
            lastActiveDate: today,
          });
          return;
        }

        const lastActiveDate = new Date(lastActive);
        const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          set({
            currentStreak: get().currentStreak + 1,
            lastActiveDate: today,
          });
        } else if (daysDiff === 0) {
          // Same day, just update last active
          set({ lastActiveDate: today });
        } else {
          // Streak broken
          set({
            currentStreak: 1,
            lastActiveDate: today,
          });
        }
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      toggleDrawer: () => {
        set({ isDrawerOpen: !get().isDrawerOpen });
      },

      showNotification: (message, type = 'info') => {
        set({
          notification: {
            visible: true,
            message,
            type,
          },
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
          get().hideNotification();
        }, 5000);
      },

      hideNotification: () => {
        set({ notification: null });
      },

      markFirstLaunchComplete: () => {
        set({ isFirstLaunch: false });
      },

      resetApp: () => {
        set({
          settings: defaultSettings,
          currentStreak: 0,
          lastActiveDate: null,
          isFirstLaunch: true,
          activeTab: 'index',
          isDrawerOpen: false,
          notification: null,
        });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastActiveDate: state.lastActiveDate,
        currentStreak: state.currentStreak,
        isFirstLaunch: state.isFirstLaunch,
      }),
    }
  )
);