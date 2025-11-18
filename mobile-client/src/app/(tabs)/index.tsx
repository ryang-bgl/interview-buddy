import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth, useReview, useAppState, useSolutions, useQuestions } from '@/hooks/useStores';

const difficultyStyles: Record<string, { backgroundColor: string; textColor: string }> = {
  Easy: { backgroundColor: '#DCFCE7', textColor: '#047857' },
  Medium: { backgroundColor: '#FDE68A', textColor: '#92400E' },
  Hard: { backgroundColor: '#FECACA', textColor: '#B91C1C' },
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { currentStreak, settings, showNotification } = useAppState();
  const { dueForReview, reviewedToday } = useReview();
  const { solutions } = useSolutions();
  const {
    questions: remoteQuestions,
    reviewStates,
    isLoading: isQuestionLoading,
    error: questionError,
    loadQuestions: loadRemoteQuestions,
    reviewQuestion: scheduleQuestionReview,
    getDueQuestions: getQuestionReminders,
    lastSyncedAt: questionLastSyncedAt,
    hasAttemptedInitialSync,
  } = useQuestions();

  const greetingName = useMemo(() => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.username) return user.username.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const avatarInitials = useMemo(() => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('');
    }

    if (user?.username) {
      return user.username[0]?.toUpperCase() ?? 'A';
    }

    if (user?.email) {
      return user.email[0]?.toUpperCase() ?? 'A';
    }

    return 'A';
  }, [user]);

  const dailyGoal = settings.review.dailyGoal ?? 0;
  const progressCount = dailyGoal > 0 ? Math.min(reviewedToday, dailyGoal) : reviewedToday;
  const progressRatio = dailyGoal > 0 ? Math.min(reviewedToday / dailyGoal, 1) : 0;
  const progressLabel = dailyGoal > 0 ? `${progressCount}/${dailyGoal} problems` : `${reviewedToday} reviewed`;

  const nextReview = dueForReview[0] ?? null;
  const nextReviewTag = nextReview?.tags?.[0] ?? 'General';
  const difficultyStyle = nextReview ? difficultyStyles[nextReview.difficulty] ?? difficultyStyles.Easy : null;

  const solvedCount = solutions.length;
  const reviewedCount = useMemo(() => solutions.filter(solution => solution.lastReviewedAt).length, [solutions]);
  const dueCount = dueForReview.length;

  const streakLabel = `${currentStreak || 0}-day streak`;
  const isOnFire = (currentStreak || 0) >= 3;

  const handleContinuePress = () => {
    router.push('/(tabs)/review');
  };

  useEffect(() => {
    if (!hasAttemptedInitialSync && !isQuestionLoading) {
      loadRemoteQuestions();
    }
  }, [hasAttemptedInitialSync, isQuestionLoading]);

  const questionReminders = useMemo(() => getQuestionReminders(), [remoteQuestions, reviewStates]);
  const nextQuestionReminder = questionReminders[0];
  const questionDueCount = questionReminders.length;

  const handleQuestionReview = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!nextQuestionReminder) {
      return;
    }

    const questionKey = nextQuestionReminder.id || nextQuestionReminder.questionIndex;
    scheduleQuestionReview(questionKey, difficulty);
    showNotification(`Logged ${difficulty} review for ${nextQuestionReminder.title}`, 'success');
  };

  const questionNotePreview = nextQuestionReminder?.note?.trim() || nextQuestionReminder?.description?.slice(0, 120) || '';

  const formattedQuestionSync = useMemo(() => {
    if (!questionLastSyncedAt) return 'Sync to stay updated';
    const syncedDate = new Date(questionLastSyncedAt);
    return `Synced ${syncedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }, [questionLastSyncedAt]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hi, {greetingName} 👋</Text>
            <Text style={styles.subGreeting}>Ready to review?</Text>
          </View>
          <View style={styles.iconPill}>
            <Feather name="bell" size={20} color="#4B5563" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardIcon}>🔥</Text>
              <Text style={styles.cardTitle}>{streakLabel}</Text>
            </View>
            {isOnFire && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>On fire!</Text>
              </View>
            )}
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Daily Progress</Text>
            <Text style={styles.progressValue}>{progressLabel}</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          </View>
        </View>

        <View style={[styles.card, styles.continueCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Feather name="play-circle" size={20} color="#1D4ED8" style={styles.iconSpacing} />
              <Text style={styles.cardTitle}>Continue Where You Left Off</Text>
            </View>
          </View>

          {nextReview ? (
            <View>
              <Text style={styles.primaryText}>{nextReview.title}</Text>
              <Text style={styles.secondaryText}>{nextReviewTag}</Text>

              <View style={styles.metaRow}>
                <View
                  style={[styles.pill, difficultyStyle && { backgroundColor: difficultyStyle.backgroundColor }]}
                >
                  <Text
                    style={[styles.pillText, difficultyStyle && { color: difficultyStyle.textColor }]}
                  >
                    {nextReview.difficulty}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyStateText}>You are all caught up. Add a problem to keep the streak going!</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !nextReview && styles.disabledButton]}
            onPress={handleContinuePress}
            disabled={!nextReview}
          >
            <Feather name="play" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Continue Review</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Feather name="trending-up" size={20} color="#047857" style={styles.iconSpacing} />
              <Text style={styles.cardTitle}>Problem Overview</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.metricSolved]}>
              <Feather name="check-circle" size={20} color="#047857" />
              <Text style={styles.metricValue}>{solvedCount}</Text>
              <Text style={styles.metricLabel}>Solved</Text>
            </View>
            <View style={[styles.metricCard, styles.metricReviewed]}>
              <Feather name="book-open" size={20} color="#1D4ED8" />
              <Text style={styles.metricValue}>{reviewedCount}</Text>
              <Text style={styles.metricLabel}>Reviewed</Text>
            </View>
            <View style={[styles.metricCard, styles.metricDue]}>
              <Feather name="clock" size={20} color="#B45309" />
              <Text style={styles.metricValue}>{dueCount}</Text>
              <Text style={styles.metricLabel}>Due</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.questionCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Feather name="edit-3" size={20} color="#7C3AED" style={styles.iconSpacing} />
              <Text style={styles.cardTitle}>Notes & Question Reminders</Text>
            </View>
            <TouchableOpacity
              style={[styles.refreshButton, isQuestionLoading && styles.refreshButtonDisabled]}
              onPress={loadRemoteQuestions}
              disabled={isQuestionLoading}
            >
              <Feather name="refresh-cw" size={16} color={isQuestionLoading ? '#9CA3AF' : '#111827'} />
              <Text style={styles.refreshText}>{isQuestionLoading ? 'Refreshing…' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {questionError && !isQuestionLoading && (
            <Text style={styles.questionError}>{questionError}</Text>
          )}

          {isQuestionLoading ? (
            <ActivityIndicator color="#7C3AED" style={styles.questionLoader} />
          ) : nextQuestionReminder ? (
            <View style={styles.questionContent}>
              <Text style={styles.primaryText}>{nextQuestionReminder.title}</Text>
              <Text style={styles.notePreview}>
                {questionNotePreview || 'No personal note yet. Capture key insights to strengthen recall.'}
              </Text>

              <View style={styles.questionMetaRow}>
                <View
                  style={[
                    styles.pill,
                    difficultyStyles[nextQuestionReminder.difficulty] && {
                      backgroundColor: difficultyStyles[nextQuestionReminder.difficulty].backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      difficultyStyles[nextQuestionReminder.difficulty] && {
                        color: difficultyStyles[nextQuestionReminder.difficulty].textColor,
                      },
                    ]}
                  >
                    {nextQuestionReminder.difficulty}
                  </Text>
                </View>
                <Text style={styles.metaText}>{questionDueCount} due</Text>
                <Text style={styles.metaText}>{formattedQuestionSync}</Text>
              </View>

              <View style={styles.questionActions}>
                <TouchableOpacity
                  style={[styles.questionButton, styles.questionEasy]}
                  onPress={() => handleQuestionReview('easy')}
                >
                  <Text style={styles.questionButtonText}>Easy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.questionButton, styles.questionMedium]}
                  onPress={() => handleQuestionReview('medium')}
                >
                  <Text style={styles.questionButtonText}>Okay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.questionButton, styles.questionHard]}
                  onPress={() => handleQuestionReview('hard')}
                >
                  <Text style={styles.questionButtonText}>Hard</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.emptyStateText}>
                {questionError
                  ? 'Unable to load your saved questions. Try refreshing once you are back online.'
                  : 'All notes reviewed for now. Capture more insights to keep the loop going!'}
              </Text>
              <Text style={styles.metaText}>{formattedQuestionSync}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 18,
  },
  header: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1F2937',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    fontSize: 20,
  },
  iconSpacing: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 999,
  },
  continueCard: {
    gap: 16,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E5E7EB',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  metricSolved: {
    backgroundColor: '#DCFCE7',
  },
  metricReviewed: {
    backgroundColor: '#DBEAFE',
  },
  metricDue: {
    backgroundColor: '#FDEAD7',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  questionCard: {
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  refreshButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  questionError: {
    color: '#B91C1C',
    fontSize: 12,
    marginBottom: 4,
  },
  questionLoader: {
    marginVertical: 12,
  },
  questionContent: {
    gap: 12,
  },
  notePreview: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  questionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  questionEasy: {
    backgroundColor: '#DCFCE7',
  },
  questionMedium: {
    backgroundColor: '#FEF3C7',
  },
  questionHard: {
    backgroundColor: '#FEE2E2',
  },
  questionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
