import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useSolutions, useQuestions } from '@/hooks/useStores';

const curatedLists = [
  {
    id: 'grind-75',
    title: 'Grind 75',
    description: 'A curated list of 75 problems to help you prepare for coding interviews',
    emoji: '💪',
    completed: 23,
    total: 75,
    badgeBackground: '#E0E7FF',
    badgeText: '#4338CA',
  },
  {
    id: 'blind-75',
    title: 'Blind 75',
    description: 'The classic 75 LeetCode problems that help you ace coding interviews',
    emoji: '🔥',
    completed: 18,
    total: 75,
    badgeBackground: '#FCE7F3',
    badgeText: '#BE185D',
  },
  {
    id: 'neetcode-150',
    title: 'NeetCode 150',
    description: 'Comprehensive list covering all important patterns and concepts',
    emoji: '📚',
    completed: 45,
    total: 150,
    badgeBackground: '#DCFCE7',
    badgeText: '#047857',
  },
  {
    id: 'hot-100',
    title: 'LeetCode Hot 100',
    description: 'Essential problems frequently asked in top interviews',
    emoji: '💡',
    completed: 31,
    total: 100,
    badgeBackground: '#FEF3C7',
    badgeText: '#B45309',
  },
];

const formatReminderDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'soon';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function ProblemListsScreen() {
  const { solutions } = useSolutions();
  const personalCount = solutions.length;
  const {
    questions,
    reviewStates,
    isLoading: isQuestionLoading,
    error: questionError,
    loadQuestions,
    refreshQuestions,
    getAllReminders,
    getDueQuestions,
    hasAttemptedInitialSync,
  } = useQuestions();

  useEffect(() => {
    if (!hasAttemptedInitialSync && !isQuestionLoading) {
      loadQuestions();
    }
  }, [hasAttemptedInitialSync, isQuestionLoading, loadQuestions]);

  const allReminders = useMemo(() => getAllReminders(), [questions, reviewStates]);
  const dueReminderCount = useMemo(() => getDueQuestions().length, [questions, reviewStates]);
  const topReminders = allReminders
    .slice()
    .sort(
      (a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
    )
    .slice(0, 3);

  const renderListCard = (item: typeof curatedLists[number]) => {
    const ratio = item.total > 0 ? Math.min(item.completed / item.total, 1) : 0;

    return (
      <View key={item.id} style={styles.listCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <View
            style={[styles.progressBadge, { backgroundColor: item.badgeBackground }]}
          >
            <Text
              style={[styles.progressBadgeText, { color: item.badgeText }]}
            >
              {item.completed}/{item.total}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.description}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.heading}>Problem Lists</Text>
          <Text style={styles.subheading}>Choose from curated lists or create your own</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Feather name="book-open" size={18} color="#111827" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>All Problems ({personalCount})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
            <Feather name="plus" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Create List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="bookmark" size={18} color="#7C3AED" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Saved List</Text>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{dueReminderCount} due</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={refreshQuestions} disabled={isQuestionLoading}>
              <Text style={styles.sectionAction}>
                {isQuestionLoading ? 'Refreshing…' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {isQuestionLoading ? (
            <ActivityIndicator color="#7C3AED" style={styles.reminderLoader} />
          ) : questionError ? (
            <Text style={styles.reminderError}>{questionError}</Text>
          ) : topReminders.length === 0 ? (
            <Text style={styles.reminderEmpty}>
              No saved questions yet. Add notes from the recorder to start building reminders.
            </Text>
          ) : (
            <View style={styles.reminderList}>
              {topReminders.map(reminder => {
                const snippet = reminder.note?.trim() || reminder.description?.slice(0, 100) || 'No note yet';
                const isDue = new Date(reminder.nextReviewDate) <= new Date();
                return (
                  <View key={reminder.id || reminder.questionIndex} style={styles.reminderCard}>
                    <View style={styles.reminderHeader}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      <Text style={styles.reminderDifficulty}>{reminder.difficulty}</Text>
                    </View>
                    <Text style={styles.reminderNote}>{snippet}</Text>
                    <View style={styles.reminderFooter}>
                      <View>
                        <Text style={styles.reminderMeta}>Next review {formatReminderDate(reminder.nextReviewDate)}</Text>
                        <Text style={styles.reminderTime}>
                          {new Date(reminder.nextReviewDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={[styles.reminderStatus, isDue && styles.reminderStatusDue]}>
                        {isDue ? 'Due now' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="users" size={18} color="#4B5563" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Popular Lists</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionAction}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listStack}>{curatedLists.map(renderListCard)}</View>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },
  headerSection: {
    marginTop: 16,
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#111827',
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1F2937',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionAction: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  listStack: {
    gap: 14,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#1F2937',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 24,
  },
  progressBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dueBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dueBadgeText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  reminderLoader: {
    paddingVertical: 20,
  },
  reminderError: {
    color: '#B91C1C',
    fontSize: 14,
  },
  reminderEmpty: {
    color: '#6B7280',
    fontSize: 14,
  },
  reminderList: {
    gap: 12,
  },
  reminderCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  reminderDifficulty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  reminderNote: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 18,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  reminderTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reminderStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  reminderStatusDue: {
    color: '#B91C1C',
  },
});
