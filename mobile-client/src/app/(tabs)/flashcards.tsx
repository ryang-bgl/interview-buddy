import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useFlashcards } from "@/hooks/useStores";
import { useColorScheme } from "@/components/useColorScheme";

const lightPalette = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  accent: "#6366F1",
  accentSoft: "#EEF2FF",
  tagBackground: "#E0E7FF",
  tagText: "#312E81",
  placeholder: "#94A3B8",
  buttonBg: "#0EA5E9",
  buttonText: "#FFFFFF",
};

const darkPalette = {
  background: "#020617",
  surface: "#0F172A",
  card: "#111C2D",
  border: "#1E293B",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  accent: "#A78BFA",
  accentSoft: "#312E81",
  tagBackground: "#1E1B4B",
  tagText: "#E0E7FF",
  placeholder: "#64748B",
  buttonBg: "#2563EB",
  buttonText: "#FFFFFF",
};

type Palette = typeof lightPalette;

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      flexGrow: 1,
      gap: 20,
    },
    header: {
      gap: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    helperText: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    searchInput: {
      marginTop: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: palette.textPrimary,
      fontSize: 14,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    summaryCount: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    refreshButton: {
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: "center",
      backgroundColor: palette.buttonBg,
    },
    refreshButtonDisabled: {
      opacity: 0.7,
    },
    tagScroll: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tagChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "transparent",
      backgroundColor: palette.accentSoft,
    },
    tagChipActive: {
      borderColor: palette.accent,
      backgroundColor: palette.tagBackground,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.tagText,
    },
    noteCard: {
      backgroundColor: palette.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 12,
    },
    noteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
      flex: 1,
    },
    noteMeta: {
      fontSize: 12,
      color: palette.textSecondary,
    },
    noteSummary: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    noteTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    noteTagPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
    },
    noteTagText: {
      fontSize: 11,
      fontWeight: "600",
      color: palette.accent,
    },
    noteActions: {
      flexDirection: "row",
      gap: 10,
    },
    primaryButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: palette.buttonBg,
    },
    primaryButtonText: {
      color: palette.buttonText,
      fontWeight: "700",
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    secondaryButtonText: {
      color: palette.textPrimary,
      fontWeight: "600",
    },
    emptyState: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    emptyText: {
      color: palette.textSecondary,
      fontSize: 14,
    },
    infoCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 18,
      backgroundColor: palette.surface,
      gap: 4,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    infoText: {
      fontSize: 13,
      color: palette.textSecondary,
      lineHeight: 18,
    },
  });

export default function FlashcardListScreen() {
  const colorScheme = useColorScheme();
  const palette = colorScheme === "dark" ? darkPalette : lightPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const router = useRouter();

  const {
    summaries,
    reviewNoteIds,
    isLoading,
    error,
    lastUpdatedAt,
    loadNotes,
    clearError,
    toggleReviewNote,
  } = useFlashcards();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!summaries.length && !isLoading) {
      loadNotes();
    }
  }, [summaries.length, isLoading, loadNotes]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    summaries.forEach((summary) =>
      summary.tags.forEach((tag) => tags.add(tag))
    );
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return summaries.filter((summary) => {
      if (selectedTag && !summary.tags.includes(selectedTag)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        (summary.topic ?? "").toLowerCase().includes(query) ||
        (summary.summary ?? "").toLowerCase().includes(query) ||
        summary.url.toLowerCase().includes(query)
      );
    });
  }, [summaries, searchQuery, selectedTag]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearError();
    await loadNotes();
    setIsRefreshing(false);
  };

  const handleStartReview = (noteId: string, isSelected: boolean) => {
    if (!isSelected) {
      toggleReviewNote(noteId);
    }
    router.push({
      pathname: "/note-review/[noteId]",
      params: { noteId },
    });
  };

  const renderNotes = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      );
    }

    if (isLoading && !summaries.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading your stacks…</Text>
        </View>
      );
    }

    if (!filteredSummaries.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No stacks match that search.</Text>
        </View>
      );
    }

    const selectedSet = new Set(reviewNoteIds);

    return (
      <View style={{ gap: 12 }}>
        {filteredSummaries.map((summary) => {
          const isSelected = selectedSet.has(summary.noteId);
          return (
            <View key={summary.noteId} style={styles.noteCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleStartReview(summary.noteId, isSelected)}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle}>
                    {summary.topic || "Untitled stack"}
                  </Text>
                  <Text style={styles.noteMeta}>{summary.cardCount} cards</Text>
                </View>
                <Text style={styles.noteSummary} numberOfLines={3}>
                  {summary.summary || "No summary saved yet."}
                </Text>
                {summary.tags.length ? (
                  <View style={styles.noteTags}>
                    {summary.tags.slice(0, 4).map((tag) => (
                      <View
                        key={`${summary.noteId}-${tag}`}
                        style={styles.noteTagPill}
                      >
                        <Text style={styles.noteTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={[styles.primaryButton]}
                  onPress={() => handleStartReview(summary.noteId, isSelected)}
                >
                  <Text style={styles.primaryButtonText}>Start review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => toggleReviewNote(summary.noteId)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isSelected ? "Remove from list" : "Add to list"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Flashcards</Text>
          <Text style={styles.helperText}>
            Curate your review list, then tap a note to walk through all of its
            cards.
          </Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by topic, summary, or URL"
            placeholderTextColor={palette.placeholder}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Stacks</Text>
            <Text style={styles.summaryCount}>
              {filteredSummaries.length} result
              {filteredSummaries.length === 1 ? "" : "s"} •{" "}
              {reviewNoteIds.length} in review list
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.refreshButton,
              isLoading && styles.refreshButtonDisabled,
            ]}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? "Syncing…" : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {availableTags.length ? (
          <View style={styles.tagScroll}>
            <TouchableOpacity
              style={[styles.tagChip, !selectedTag && styles.tagChipActive]}
              onPress={() => setSelectedTag(null)}
            >
              <Text style={styles.tagText}>All</Text>
            </TouchableOpacity>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTag === tag && styles.tagChipActive,
                ]}
                onPress={() => setSelectedTag(tag === selectedTag ? null : tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {renderNotes()}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How the review list works</Text>
          <Text style={styles.infoText}>
            Only notes in your review list participate in spaced repetition. Use
            “Add to list” to include a stack, then “Start review” to work
            through every card on a dedicated screen. After the final card, you
            can rate the overall difficulty of the note.
          </Text>
          {lastUpdatedAt ? (
            <Text style={styles.infoText}>
              Last synced {new Date(lastUpdatedAt).toLocaleString()}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
