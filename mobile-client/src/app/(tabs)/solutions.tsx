import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useSolutions, useQuestions } from "@/hooks/useStores";
import { useColorScheme } from "@/components/useColorScheme";

const curatedLists = [
  {
    id: "grind-75",
    title: "Grind 75",
    description:
      "A curated list of 75 problems to help you prepare for coding interviews",
    emoji: "💪",
    completed: 23,
    total: 75,
    badgeBackground: "#E0E7FF",
    badgeText: "#4338CA",
  },
  {
    id: "blind-75",
    title: "Blind 75",
    description:
      "The classic 75 LeetCode problems that help you ace coding interviews",
    emoji: "🔥",
    completed: 18,
    total: 75,
    badgeBackground: "#FCE7F3",
    badgeText: "#BE185D",
  },
  {
    id: "neetcode-150",
    title: "NeetCode 150",
    description:
      "Comprehensive list covering all important patterns and concepts",
    emoji: "📚",
    completed: 45,
    total: 150,
    badgeBackground: "#DCFCE7",
    badgeText: "#047857",
  },
  {
    id: "hot-100",
    title: "LeetCode Hot 100",
    description: "Essential problems frequently asked in top interviews",
    emoji: "💡",
    completed: 31,
    total: 100,
    badgeBackground: "#FEF3C7",
    badgeText: "#B45309",
  },
];

const formatReminderDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "soon";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const lightPalette = {
  background: "#F5F6FA",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  cardBorder: "#E5E7EB",
  critical: "#B91C1C",
  accent: "#7C3AED",
  buttonBackground: "#E0E7FF",
  buttonText: "#1D4ED8",
};

const darkPalette = {
  background: "#0B1220",
  surface: "#111827",
  textPrimary: "#F3F4F6",
  textSecondary: "#CBD5F5",
  textMuted: "#94A3B8",
  cardBorder: "#1F2937",
  critical: "#F87171",
  accent: "#A78BFA",
  buttonBackground: "#1D4ED8",
  buttonText: "#F8FAFC",
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
    headerSection: {
      gap: 8,
    },
    heading: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    subheading: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    sectionCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionIcon: {
      backgroundColor: palette.buttonBackground,
      padding: 8,
      borderRadius: 999,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    dueBadge: {
      backgroundColor: palette.buttonBackground,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    dueBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.buttonText,
    },
    sectionAction: {
      fontSize: 14,
      fontWeight: "600",
      color: palette.buttonText,
    },
    reminderLoader: {
      marginTop: 12,
    },
    reminderError: {
      color: palette.critical,
      fontSize: 14,
    },
    reminderEmpty: {
      color: palette.textSecondary,
      fontSize: 14,
    },
    reminderList: {
      gap: 12,
    },
    reminderCard: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      borderRadius: 16,
      padding: 16,
      gap: 8,
    },
    reminderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
      flex: 1,
    },
    reminderDifficulty: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.accent,
    },
    reminderNote: {
      color: palette.textSecondary,
      fontSize: 13,
    },
    reminderFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    reminderMeta: {
      fontSize: 12,
      color: palette.textSecondary,
    },
    reminderTime: {
      fontSize: 12,
      color: palette.textMuted,
    },
    reminderActions: {
      alignItems: "flex-end",
      gap: 6,
    },
    reminderStatus: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.buttonText,
    },
    reminderStatusDue: {
      color: palette.critical,
    },
    detailLink: {
      backgroundColor: palette.buttonBackground,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    detailLinkText: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.buttonText,
    },
    listStack: {
      gap: 12,
    },
    listCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      padding: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: palette.cardBorder,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      fontWeight: "700",
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    cardSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    progressTrack: {
      height: 6,
      backgroundColor: palette.cardBorder,
      borderRadius: 999,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: palette.buttonText,
    },
  });

export default function ProblemListsScreen() {
  const colorScheme = useColorScheme();
  const palette = useMemo<Palette>(
    () => (colorScheme === "dark" ? darkPalette : lightPalette),
    [colorScheme]
  );
  const styles = useMemo(() => createStyles(palette), [palette]);
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

  const allReminders = useMemo(
    () => getAllReminders(),
    [questions, reviewStates]
  );
  const dueReminderCount = useMemo(
    () => getDueQuestions().length,
    [questions, reviewStates]
  );
  
  const sortedReminders = useMemo(
    () =>
      allReminders
        .slice()
        .sort(
          (a, b) =>
            new Date(a.nextReviewDate).getTime() -
            new Date(b.nextReviewDate).getTime()
        ),
    [allReminders]
  );

  const WINDOW_SIZE = 5;
  const [windowStart, setWindowStart] = React.useState(0);
  const maxStart = Math.max(0, sortedReminders.length - WINDOW_SIZE);
  const clampedStart = Math.min(windowStart, maxStart);

  const visibleReminders = sortedReminders.slice(
    clampedStart,
    clampedStart + WINDOW_SIZE
  );

  useEffect(() => {
    if (windowStart !== clampedStart) {
      setWindowStart(clampedStart);
    }
  }, [clampedStart, windowStart]);

  const handleSlide = (direction: 'prev' | 'next') => {
    setWindowStart((current) => {
      if (direction === 'prev') {
        return Math.max(0, current - WINDOW_SIZE);
      }
      return Math.min(sortedReminders.length - WINDOW_SIZE, current + WINDOW_SIZE);
    });
  };
  const renderListCard = (item: (typeof curatedLists)[number]) => {
    const ratio = item.total > 0 ? Math.min(item.completed / item.total, 1) : 0;

    return (
      <View key={item.id} style={styles.listCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <View
            style={[
              styles.progressBadge,
              { backgroundColor: item.badgeBackground },
            ]}
          >
            <Text style={[styles.progressBadgeText, { color: item.badgeText }]}>
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
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.heading}>Problem Lists</Text>
          {/* <Text style={styles.subheading}>
            Choose from curated lists or create your own
          </Text> */}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              {/* <Feather
                name="bookmark"
                size={18}
                color={palette.accent}
                style={styles.sectionIcon}
              /> */}
              <Text style={styles.sectionTitle}>My Saved</Text>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{dueReminderCount} due</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={refreshQuestions}
              disabled={isQuestionLoading}
            >
              <Text style={styles.sectionAction}>
                {isQuestionLoading ? "Refreshing…" : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>

          {isQuestionLoading ? (
            <ActivityIndicator color="#7C3AED" style={styles.reminderLoader} />
          ) : questionError ? (
            <Text style={styles.reminderError}>{questionError}</Text>
          ) : sortedReminders.length === 0 ? (
            <Text style={styles.reminderEmpty}>
              No saved questions yet. Add notes from the recorder to start
              building reminders.
            </Text>
          ) : (
            <View style={styles.reminderList}>
              <View style={styles.sliderControls}>
                <TouchableOpacity
                  style={[
                    styles.sliderButton,
                    clampedStart === 0 && styles.sliderButtonDisabled,
                  ]}
                  disabled={clampedStart === 0}
                  onPress={() => handleSlide('prev')}
                >
                  <Feather name="chevron-left" size={16} color="#1D4ED8" />
                </TouchableOpacity>
                <Text style={styles.sliderLabel}>
                  {sortedReminders.length === 0
                    ? '0/0'
                    : `${clampedStart + 1}-${Math.min(
                        clampedStart + WINDOW_SIZE,
                        sortedReminders.length
                      )}/${sortedReminders.length}`}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.sliderButton,
                    clampedStart >= maxStart && styles.sliderButtonDisabled,
                  ]}
                  disabled={clampedStart >= maxStart}
                  onPress={() => handleSlide('next')}
                >
                  <Feather name="chevron-right" size={16} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
              {visibleReminders.map((reminder) => {
                const snippet =
                  reminder.note?.trim() ||
                  reminder.description?.slice(0, 100) ||
                  "No note yet";
                const isDue = new Date(reminder.nextReviewDate) <= new Date();
                const identifier = reminder.questionIndex || reminder.id;
                return (
                  <TouchableOpacity
                    key={reminder.id || reminder.questionIndex}
                    style={styles.reminderCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/problem/[questionIndex]",
                        params: { questionIndex: identifier ?? "" },
                      })
                    }
                  >
                    <View style={styles.reminderHeader}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      {reminder.difficulty !== "Unknown" && (
                        <Text style={styles.reminderDifficulty}>
                          {reminder.difficulty}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.reminderNote}>{snippet}</Text>
                    <View style={styles.reminderFooter}>
                      <View>
                        <Text style={styles.reminderMeta}>
                          Next review{" "}
                          {formatReminderDate(reminder.nextReviewDate)}
                        </Text>
                        <Text style={styles.reminderTime}>
                          {new Date(reminder.nextReviewDate).toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </Text>
                      </View>
                      <View style={styles.reminderActions}>
                        <Text
                          style={[
                            styles.reminderStatus,
                            isDue && styles.reminderStatusDue,
                          ]}
                        >
                          {isDue ? "Due now" : "Scheduled"}
                        </Text>
                        <TouchableOpacity
                          style={styles.detailLink}
                          onPress={(event) => {
                            event.stopPropagation();
                            router.push({
                              pathname: "/problem/[questionIndex]",
                              params: { questionIndex: identifier ?? "" },
                            });
                          }}
                        >
                          <Text style={styles.detailLinkText}>View Detail</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="users" size={18} color={palette.textSecondary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Popular Lists</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionAction}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listStack}>{curatedLists.map(renderListCard)}</View>
        </View> */}
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
    fontWeight: "700",
    color: "#111827",
  },
  subheading: {
    fontSize: 14,
    color: "#6B7280",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#111827",
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#1F2937",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIcon: {
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  sectionAction: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  listStack: {
    gap: 14,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#1F2937",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: "600",
  },
  dueBadge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dueBadgeText: {
    color: "#4338CA",
    fontWeight: "600",
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  reminderLoader: {
    paddingVertical: 20,
  },
  reminderError: {
    color: "#B91C1C",
    fontSize: 14,
  },
  reminderEmpty: {
    color: "#6B7280",
    fontSize: 14,
  },
  reminderList: {
    gap: 12,
  },
  reminderCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  reminderDifficulty: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  reminderNote: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 18,
  },
  reminderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  reminderTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  reminderActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  reminderStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  reminderStatusDue: {
    color: "#B91C1C",
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
});
