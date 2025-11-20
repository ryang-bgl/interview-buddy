import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, GestureResponderEvent, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';

import {
  useAuth,
  useReview,
  useAppState,
  useSolutions,
  useQuestions,
} from '@/hooks/useStores';

const difficultyStyles: Record<
  string,
  { backgroundColor: string; textColor: string }
> = {
  Easy: { backgroundColor: "#DCFCE7", textColor: "#047857" },
  Medium: { backgroundColor: "#FDE68A", textColor: "#92400E" },
  Hard: { backgroundColor: "#FECACA", textColor: "#B91C1C" },
};

const lightPalette = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#94A3B8',
  quickCardDue: '#FEF3C7',
  quickCardReviewed: '#DBEAFE',
  quickCardStreak: '#E0E7FF',
  cardBorder: '#E5E7EB',
  highlight: '#2563EB',
  critical: '#DC2626',
  buttonBackground: '#E0E7FF',
  buttonText: '#1D4ED8',
};

const darkPalette = {
  background: '#0B1220',
  surface: '#111827',
  textPrimary: '#F9FAFB',
  textSecondary: '#CBD5F5',
  textMuted: '#94A3B8',
  quickCardDue: '#5B3A00',
  quickCardReviewed: '#1E3A8A',
  quickCardStreak: '#312E81',
  cardBorder: '#1F2937',
  highlight: '#60A5FA',
  critical: '#F87171',
  buttonBackground: '#1D4ED8',
  buttonText: '#F8FAFC',
};

type Palette = typeof lightPalette;

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    contentContainer: {
      paddingBottom: 32,
      paddingHorizontal: 20,
      gap: 18,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    headerTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    greeting: {
      fontSize: 20,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    subGreeting: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 4,
    },
    iconPill: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    quickStatsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quickStatCard: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 12,
    },
    quickStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    quickStatLabel: {
      marginTop: 4,
      fontSize: 12,
      color: palette.textSecondary,
      fontWeight: '600',
    },
    quickStatDue: {
      backgroundColor: palette.quickCardDue,
    },
    quickStatReviewed: {
      backgroundColor: palette.quickCardReviewed,
    },
    quickStatStreak: {
      backgroundColor: palette.quickCardStreak,
    },
    reviewSection: {
      gap: 12,
      paddingTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.highlight,
    },
    reviewCards: {
      gap: 14,
    },
    reviewCard: {
      backgroundColor: palette.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    reviewTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reviewProblemNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    difficultyPill: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    difficultyPillText: {
      fontSize: 12,
      fontWeight: '600',
    },
    reviewTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.textPrimary,
      marginTop: 8,
    },
    reviewTagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    tagPill: {
      backgroundColor: palette.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    tagPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    reviewFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
      borderTopWidth: 1,
      borderColor: palette.cardBorder,
      paddingTop: 12,
    },
    reviewActions: {
      alignItems: 'flex-end',
      gap: 6,
    },
    reviewDueStatus: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    reviewDueCritical: {
      color: palette.critical,
    },
    reviewCountText: {
      fontSize: 12,
      color: palette.textSecondary,
      fontWeight: '500',
    },
    reviewMetaTime: {
      fontSize: 12,
      color: palette.textMuted,
    },
    detailLink: {
      backgroundColor: palette.buttonBackground,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    detailLinkText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.buttonText,
    },
    reviewStatusText: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 8,
    },
    reviewErrorText: {
      fontSize: 14,
      color: palette.critical,
      marginTop: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 8,
    },
  });

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette = useMemo<Palette>(
    () => (colorScheme === 'dark' ? darkPalette : lightPalette),
    [colorScheme]
  );
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { user } = useAuth();
  const { currentStreak } = useAppState();
  const { dueForReview } = useReview();
  const { solutions } = useSolutions();
  const {
    questions,
    reviewStates,
    isLoading: isQuestionLoading,
    error: questionError,
    loadQuestions,
    getAllReminders,
    hasAttemptedInitialSync,
  } = useQuestions();

  const greetingName = useMemo(() => {
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.username) return user.username.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  }, [user]);

  const avatarInitials = useMemo(() => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join("");
    }

    if (user?.username) {
      return user.username[0]?.toUpperCase() ?? "A";
    }

    if (user?.email) {
      return user.email[0]?.toUpperCase() ?? "A";
    }

    return "A";
  }, [user]);

  const reviewedCount = useMemo(
    () => solutions.filter((solution) => solution.lastReviewedAt).length,
    [solutions]
  );
  const dueCount = dueForReview.length;
  const streakDays = currentStreak || 0;

  useEffect(() => {
    if (!hasAttemptedInitialSync && !isQuestionLoading) {
      loadQuestions();
    }
  }, [hasAttemptedInitialSync, isQuestionLoading, loadQuestions]);

  const questionReminders = useMemo(() => getAllReminders(), [questions, reviewStates, getAllReminders]);

  const sortedQuestionReminders = useMemo(() => {
    return questionReminders
      .slice()
      .sort(
        (a, b) =>
          new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
      );
  }, [questionReminders]);

  const getDueStatus = (value: Date | string) => {
    const dueDate = new Date(value);
    if (Number.isNaN(dueDate.getTime())) {
      return { label: "Due soon", isCritical: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueAtMidnight = new Date(dueDate);
    dueAtMidnight.setHours(0, 0, 0, 0);
    const msInDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((dueAtMidnight.getTime() - today.getTime()) / msInDay);

    if (diffDays < 0) {
      return { label: "Overdue", isCritical: true };
    }

    if (diffDays === 0) {
      return { label: "Due today", isCritical: true };
    }

    if (diffDays === 1) {
      return { label: "Due tomorrow", isCritical: false };
    }

    if (diffDays > 1 && diffDays <= 3) {
      return { label: `In ${diffDays} days`, isCritical: false };
    }

    return {
      label: `Due ${dueDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`,
      isCritical: false,
    };
  };

  const reminderBuckets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 1000 * 60 * 60 * 24;

    const buckets = {
      overdue: [] as typeof questionReminders,
      today: [] as typeof questionReminders,
      tomorrow: [] as typeof questionReminders,
    };

    sortedQuestionReminders.forEach(reminder => {
      const dueDate = new Date(reminder.nextReviewDate);
      const dueMidnight = new Date(dueDate);
      dueMidnight.setHours(0, 0, 0, 0);
      const diffDays = Math.round((dueMidnight.getTime() - today.getTime()) / dayMs);

      if (diffDays < 0) {
        buckets.overdue.push(reminder);
      } else if (diffDays === 0) {
        buckets.today.push(reminder);
      } else if (diffDays === 1) {
        buckets.tomorrow.push(reminder);
      }
    });

    return buckets;
  }, [sortedQuestionReminders]);

  const visibleReviews =
    [...reminderBuckets.overdue, ...reminderBuckets.today, ...reminderBuckets.tomorrow].slice(0, 4);

  const handleViewAllPress = () => {
    router.push("/(tabs)/review");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hi, {greetingName} 👋</Text>
            <Text style={styles.subGreeting}>Ready to review?</Text>
          </View>
          <View style={styles.iconPill}>
            <Feather name="bell" size={20} color="#4B5563" />
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStatCard, styles.quickStatDue]}>
            <Text style={styles.quickStatValue}>{dueCount}</Text>
            <Text style={styles.quickStatLabel}>Due Reviews</Text>
          </View>
          <View style={[styles.quickStatCard, styles.quickStatReviewed]}>
            <Text style={styles.quickStatValue}>{reviewedCount}</Text>
            <Text style={styles.quickStatLabel}>Reviewed</Text>
          </View>
          <View style={[styles.quickStatCard, styles.quickStatStreak]}>
            <Text style={styles.quickStatValue}>{streakDays}</Text>
            <Text style={styles.quickStatLabel}>Days Streak</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Reviews</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllPress}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="chevron-right" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {isQuestionLoading ? (
            <Text style={styles.reviewStatusText}>Loading upcoming reviews…</Text>
          ) : questionError ? (
            <Text style={styles.reviewErrorText}>{questionError}</Text>
          ) : visibleReviews.length ? (
            <View style={styles.reviewCards}>
              {visibleReviews.map((review) => {
                const difficultyStyle =
                  difficultyStyles[review.difficulty] ?? difficultyStyles.Easy;
                const tagsToShow =
                  (review.tags || review.topicTags || []).slice(0, 2);
                const dueStatus = getDueStatus(review.nextReviewDate);
                const reviewCount = review.repetitions ?? 0;
                const identifier = review.questionIndex || review.id || "-";

                return (
                  <TouchableOpacity
                    key={review.id}
                    style={styles.reviewCard}
                    activeOpacity={0.85}
                    onPress={() => router.push('/(tabs)/review')}
                  >
                    <View style={styles.reviewTopRow}>
                      <Text style={styles.reviewProblemNumber}>
                        #{identifier}
                      </Text>
                      <View
                        style={[
                          styles.difficultyPill,
                          { backgroundColor: difficultyStyle.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyPillText,
                            { color: difficultyStyle.textColor },
                          ]}
                        >
                          {review.difficulty}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.reviewTitle}>{review.title}</Text>
                    {tagsToShow.length > 0 && (
                      <View style={styles.reviewTagRow}>
                        {tagsToShow.map((tag) => (
                          <View key={tag} style={styles.tagPill}>
                            <Text style={styles.tagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View style={styles.reviewFooterRow}>
                      <View>
                        <Text
                          style={[
                            styles.reviewDueStatus,
                            dueStatus.isCritical && styles.reviewDueCritical,
                          ]}
                        >
                          {dueStatus.label}
                        </Text>
                        <Text style={styles.reviewMetaTime}>
                          Scheduled at {new Date(review.nextReviewDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={styles.reviewActions}>
                        <Text style={styles.reviewCountText}>
                          Reviewed {reviewCount}x
                        </Text>
                        <TouchableOpacity
                          onPress={(event: GestureResponderEvent) => {
                            event.stopPropagation();
                            router.push(`/problem/${identifier}`);
                          }}
                          style={styles.detailLink}
                        >
                          <Text style={styles.detailLinkText}>View Detail</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>
              No overdue or upcoming questions. Capture a note to queue up new reminders.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  subGreeting: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  quickStatLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  quickStatDue: {
    backgroundColor: "#FEF3C7",
  },
  quickStatReviewed: {
    backgroundColor: "#DBEAFE",
  },
  quickStatStreak: {
    backgroundColor: "#E0E7FF",
  },
  reviewSection: {
    gap: 12,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  reviewCards: {
    gap: 14,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewProblemNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  difficultyPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  difficultyPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
  },
  reviewTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  reviewFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 12,
  },
  reviewActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  reviewDueStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  reviewDueCritical: {
    color: "#DC2626",
  },
  reviewCountText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  reviewMetaTime: {
    fontSize: 12,
    color: "#94A3B8",
  },
  detailLink: {
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  reviewStatusText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  reviewErrorText: {
    fontSize: 14,
    color: "#B91C1C",
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
});
