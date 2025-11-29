import {
  useAuthStore,
  useSolutionStore,
  useAppStore,
  useQuestionStore,
  useFlashcardStore,
} from "@/stores";

// Combined store hook for components that need multiple stores
export const useStores = () => {
  const auth = useAuthStore();
  const solutions = useSolutionStore();
  const app = useAppStore();
  const questions = useQuestionStore();

  return {
    auth,
    solutions,
    app,
    questions,
  };
};

// Specialized hooks for common use cases
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    register,
    sendMagicLink,
    completeMagicLinkSignIn,
    checkForMagicLink,
    isLoading,
    error,
    emailForSignIn,
    clearError,
    setEmailForSignIn,
    initialize,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    emailForSignIn,
    login,
    logout,
    register,
    sendMagicLink,
    completeMagicLinkSignIn,
    checkForMagicLink,
    clearError,
    setEmailForSignIn,
    initialize,
  };
};

export const useSolutions = () => {
  const {
    solutions,
    isLoading,
    error,
    addSolution,
    updateSolution,
    deleteSolution,
    reviewSolution,
    loadSolutions,
    getDueForReview,
    getSolutionsByDifficulty,
    getSolutionsByTag,
    clearError,
  } = useSolutionStore();

  return {
    solutions,
    isLoading,
    error,
    addSolution,
    updateSolution,
    deleteSolution,
    reviewSolution,
    loadSolutions,
    getDueForReview,
    getSolutionsByDifficulty,
    getSolutionsByTag,
    clearError,
  };
};

export const useQuestions = () => {
  const {
    questions,
    reviewStates,
    isLoading,
    error,
    loadQuestions,
    refreshQuestions,
    reviewQuestion,
    getDueQuestions,
    getAllReminders,
    clearError,
    lastSyncedAt,
    hasAttemptedInitialSync,
  } = useQuestionStore();

  return {
    questions,
    reviewStates,
    isLoading,
    error,
    loadQuestions,
    refreshQuestions,
    reviewQuestion,
    getDueQuestions,
    getAllReminders,
    clearError,
    lastSyncedAt,
    hasAttemptedInitialSync,
  };
};

export const useAppState = () => {
  const {
    settings,
    isOnline,
    currentStreak,
    notification,
    updateSettings,
    setOnlineStatus,
    updateStreak,
    showNotification,
    hideNotification,
    isFirstLaunch,
    markFirstLaunchComplete,
  } = useAppStore();

  return {
    settings,
    isOnline,
    currentStreak,
    notification,
    isFirstLaunch,
    updateSettings,
    setOnlineStatus,
    updateStreak,
    showNotification,
    hideNotification,
    markFirstLaunchComplete,
  };
};

export const useFlashcards = () => {
  const {
    notes,
    summaries,
    reviewNoteIds,
    reviewStates,
    isLoading,
    error,
    lastUpdatedAt,
    loadNotes,
    refreshNotes,
    reviewCard,
    getAllReminders,
    getDueCards,
    clearError,
    toggleReviewNote,
  } = useFlashcardStore();

  return {
    notes,
    summaries,
    reviewNoteIds,
    reviewStates,
    isLoading,
    error,
    lastUpdatedAt,
    loadNotes,
    refreshNotes,
    reviewCard,
    getAllReminders,
    getDueCards,
    clearError,
    toggleReviewNote,
  };
};

// Hook for sync status across stores
export const useSyncStatus = () => {
  const { syncStatus, syncSolutions, lastSyncTime } = useSolutionStore();
  const { isOnline } = useAppStore();

  return {
    syncStatus,
    isOnline,
    lastSyncTime,
    canSync: isOnline && syncStatus !== "syncing",
    sync: syncSolutions,
  };
};

// Hook for review functionality
export const useReview = () => {
  const { getDueForReview, reviewSolution, solutions } = useSolutionStore();
  const { updateStreak } = useAppStore();

  const dueForReview = getDueForReview();
  const totalSolutions = solutions.length;
  const reviewedToday = solutions.filter((s) => {
    if (!s.lastReviewedAt) return false;
    const today = new Date().toDateString();
    return new Date(s.lastReviewedAt).toDateString() === today;
  }).length;

  const completeReview = (id: string, difficulty: "easy" | "good" | "hard") => {
    reviewSolution(id, difficulty);
    updateStreak();
  };

  return {
    dueForReview,
    totalSolutions,
    reviewedToday,
    completeReview,
  };
};
