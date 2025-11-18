// Test utilities for Zustand stores
// This can be used to test store functionality

import { useAuthStore, useSolutionStore, useAppStore } from '@/stores';

// Test auth store functionality
export const testAuthStore = () => {
  console.log('Testing Auth Store...');

  const authStore = useAuthStore.getState();

  // Test initial state
  console.log('Initial auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
  });

  // Test setters
  authStore.setUser({
    id: 'test-user',
    username: 'testuser',
    email: 'test@example.com',
  });

  console.log('After setting user:', {
    user: authStore.user,
  });

  // Test clearing
  authStore.logout();
  console.log('After logout:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
  });
};

// Test solution store functionality
export const testSolutionStore = () => {
  console.log('Testing Solution Store...');

  const solutionStore = useSolutionStore.getState();

  // Test initial state
  console.log('Initial solution state:', {
    solutions: solutionStore.solutions,
    isLoading: solutionStore.isLoading,
    error: solutionStore.error,
  });

  // Test adding a solution locally
  const testSolution = {
    id: 'test-solution-1',
    problemNumber: 1,
    title: 'Two Sum',
    difficulty: 'Easy' as const,
    code: 'function twoSum(nums, target) { /* solution */ }',
    language: 'javascript',
    tags: ['array', 'hash-table'],
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  solutionStore.addSolutionLocally(testSolution);
  console.log('After adding solution locally:', {
    solutionsCount: solutionStore.solutions.length,
    firstSolution: solutionStore.solutions[0],
  });

  // Test review functionality
  solutionStore.reviewSolution('test-solution-1', 'easy');
  console.log('After reviewing solution:', {
    reviewedSolution: solutionStore.solutions[0],
  });

  // Test getters
  console.log('Due for review:', solutionStore.getDueForReview());
  console.log('Easy solutions:', solutionStore.getSolutionsByDifficulty('Easy'));
  console.log('Array tag solutions:', solutionStore.getSolutionsByTag('array'));
};

// Test app store functionality
export const testAppStore = () => {
  console.log('Testing App Store...');

  const appStore = useAppStore.getState();

  // Test initial state
  console.log('Initial app state:', {
    settings: appStore.settings,
    currentStreak: appStore.currentStreak,
    isFirstLaunch: appStore.isFirstLaunch,
  });

  // Test updating settings
  appStore.updateSettings({
    theme: 'dark',
    review: {
      ...appStore.settings.review,
      dailyGoal: 10,
    },
  });

  console.log('After updating settings:', {
    theme: appStore.settings.theme,
    dailyGoal: appStore.settings.review.dailyGoal,
  });

  // Test streak functionality
  appStore.updateStreak();
  console.log('After updating streak:', {
    currentStreak: appStore.currentStreak,
    lastActiveDate: appStore.lastActiveDate,
  });

  // Test notifications
  appStore.showNotification('Test notification', 'success');
  console.log('After showing notification:', {
    notification: appStore.notification,
  });

  // Test hiding notification
  setTimeout(() => {
    appStore.hideNotification();
    console.log('After hiding notification:', {
      notification: appStore.notification,
    });
  }, 1000);
};

// Run all tests
export const runAllTests = () => {
  console.log('=== Running Zustand Store Tests ===');
  testAuthStore();
  console.log('');
  testSolutionStore();
  console.log('');
  testAppStore();
  console.log('=== Tests Complete ===');
};
