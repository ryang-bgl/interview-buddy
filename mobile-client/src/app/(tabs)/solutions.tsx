import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useSolutions, useQuestions } from "@/hooks/useStores";
import { useColorScheme } from "@/components/useColorScheme";

type DifficultyOption = "Easy" | "Good" | "Hard" | "Unknown";

const DIFFICULTY_FILTERS: DifficultyOption[] = [
  "Easy",
  "Good",
  "Hard",
  "Unknown",
];

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
  highlight: "#2563EB",
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
  highlight: "#A78BFA",
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
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    actionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.surface,
    },
    actionChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.textSecondary,
    },
    selectedFilterLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.highlight,
    },
    searchInput: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: palette.surface,
      color: palette.textPrimary,
    },
    filterDropdown: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.surface,
      padding: 12,
      gap: 10,
    },
    filterOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterOptionText: {
      color: palette.textPrimary,
      fontWeight: "600",
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      backgroundColor: palette.buttonText,
      borderColor: palette.buttonText,
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
    sliderControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      gap: 12,
    },
    sliderButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
    },
    sliderButtonDisabled: {
      opacity: 0.45,
    },
    sliderLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.buttonText,
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
    paginationRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
    },
    pageButton: {
      minWidth: 36,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      alignItems: "center",
    },
    pageButtonActive: {
      backgroundColor: palette.buttonText,
      borderColor: palette.buttonText,
    },
    pageButtonText: {
      color: palette.buttonText,
      fontWeight: "600",
    },
    pageButtonTextActive: {
      color: palette.surface,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<DifficultyOption[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

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

  const filteredReminders = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    return sortedReminders.filter((reminder) => {
      const difficultyValue = (reminder.difficulty ??
        "Unknown") as DifficultyOption;
      const matchesQuery = lowerQuery
        ? (reminder.title || "").toLowerCase().includes(lowerQuery) ||
          (reminder.questionIndex || "").toLowerCase().includes(lowerQuery)
        : true;

      const matchesFilter = selectedFilters.length
        ? selectedFilters.includes(difficultyValue)
        : true;

      return matchesQuery && matchesFilter;
    });
  }, [sortedReminders, searchQuery, selectedFilters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReminders.length / PAGE_SIZE)
  );
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * PAGE_SIZE;
  const visibleReminders = filteredReminders.slice(
    pageStart,
    pageStart + PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage !== clampedPage) {
      setCurrentPage(clampedPage);
    }
  }, [clampedPage, currentPage]);

  const handleToggleFilter = (option: DifficultyOption) => {
    setSelectedFilters((prev) =>
      prev.includes(option)
        ? prev.filter((value) => value !== option)
        : [...prev, option]
    );
    setCurrentPage(1);
  };

  const handleSelectPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  const pageButtons = useMemo(() => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(i);
    }
    return buttons;
  }, [totalPages]);

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

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => setIsSearchVisible((prev) => !prev)}
            >
              <Feather
                name="search"
                size={16}
                color={
                  isSearchVisible ? palette.buttonText : palette.textSecondary
                }
              />
              <Text style={styles.actionChipText}>
                {isSearchVisible ? "Hide search" : "Search"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => setFilterMenuVisible((prev) => !prev)}
            >
              <Feather
                name="filter"
                size={16}
                color={
                  filterMenuVisible ? palette.buttonText : palette.textSecondary
                }
              />
              <Text style={styles.actionChipText}>
                {filterMenuVisible ? "Hide filters" : "Filter"}
              </Text>
            </TouchableOpacity>
            {selectedFilters.length > 0 && (
              <Text style={styles.selectedFilterLabel}>
                {selectedFilters.join(", ")}
              </Text>
            )}
          </View>

          {isSearchVisible && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or #"
              placeholderTextColor={palette.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />
          )}

          {filterMenuVisible && (
            <View style={styles.filterDropdown}>
              {DIFFICULTY_FILTERS.map((option) => {
                const isSelected = selectedFilters.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.filterOption}
                    onPress={() => handleToggleFilter(option)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <Text style={styles.filterOptionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

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
                    clampedPage === 1 && styles.sliderButtonDisabled,
                  ]}
                  disabled={clampedPage === 1}
                  onPress={() => handleSelectPage(clampedPage - 1)}
                >
                  <Feather name="chevron-left" size={16} color="#1D4ED8" />
                </TouchableOpacity>
                <Text style={styles.sliderLabel}>
                  {filteredReminders.length === 0
                    ? "0/0"
                    : `${pageStart + 1}-${Math.min(
                        pageStart + PAGE_SIZE,
                        filteredReminders.length
                      )}/${filteredReminders.length}`}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.sliderButton,
                    clampedPage === totalPages && styles.sliderButtonDisabled,
                  ]}
                  disabled={clampedPage === totalPages}
                  onPress={() => handleSelectPage(clampedPage + 1)}
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
                const reminderDifficulty = (reminder.difficulty ??
                  "Unknown") as DifficultyOption;
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
                      {reminderDifficulty !== "Unknown" && (
                        <Text style={styles.reminderDifficulty}>
                          {reminderDifficulty}
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
              {totalPages > 1 && (
                <View style={styles.paginationRow}>
                  {pageButtons.map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={[
                        styles.pageButton,
                        page === clampedPage && styles.pageButtonActive,
                      ]}
                      onPress={() => handleSelectPage(page)}
                    >
                      <Text
                        style={[
                          styles.pageButtonText,
                          page === clampedPage && styles.pageButtonTextActive,
                        ]}
                      >
                        {page}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
