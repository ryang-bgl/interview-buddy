import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State as GestureState,
} from "react-native-gesture-handler";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useFlashcards, useAppState } from "@/hooks/useStores";
import { ReviewDifficulty } from "@/config/spacedRepetition";
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
      gap: 16,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    backButtonText: {
      color: palette.accent,
      fontWeight: "600",
      fontSize: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    summaryText: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    tagPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
    },
    tagText: {
      fontSize: 11,
      fontWeight: "600",
      color: palette.accent,
    },
    statusText: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    card: {
      marginTop: 12,
      backgroundColor: palette.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 18,
      gap: 12,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.accent,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    cardText: {
      fontSize: 18,
      lineHeight: 28,
      color: palette.textPrimary,
    },
    promptText: {
      fontWeight: "700",
      color: palette.textPrimary,
    },
    extraText: {
      fontSize: 13,
      marginTop: 6,
      color: palette.textSecondary,
    },
    cardTagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    cardTagPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
    },
    cardTagText: {
      fontSize: 11,
      fontWeight: "600",
      color: palette.accent,
    },
    nextButton: {
      marginTop: 12,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: "#0EA5E9",
    },
    nextButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    resultButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    hardButton: {
      backgroundColor: "#EF4444",
    },
    goodButton: {
      backgroundColor: "#F97316",
    },
    easyButton: {
      backgroundColor: "#22C55E",
    },
    resultText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    emptyState: {
      marginTop: 20,
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
    secondaryLink: {
      marginTop: 8,
    },
    secondaryLinkText: {
      fontSize: 13,
      color: palette.accent,
    },
  });

export default function FlashcardNoteReviewScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const colorScheme = useColorScheme();
  const palette = colorScheme === "dark" ? darkPalette : lightPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);

  const { showNotification } = useAppState();
  const {
    notes,
    reviewStates,
    reviewNoteIds,
    isLoading,
    error,
    loadNotes,
    reviewCard,
    toggleReviewNote,
  } = useFlashcards();

  useEffect(() => {
    if (!notes.length && !isLoading) {
      loadNotes();
    }
  }, [notes.length, isLoading, loadNotes]);

  const note = useMemo(
    () => notes.find((candidate) => candidate.noteId === noteId) ?? null,
    [notes, noteId]
  );

  const noteTags = useMemo(() => {
    if (!note) {
      return [] as string[];
    }
    const tags = new Set<string>();
    note.cards.forEach((card) => {
      card.tags?.forEach((tag) => {
        if (tag) {
          tags.add(tag);
        }
      });
    });
    return Array.from(tags);
  }, [note]);

  useEffect(() => {
    if (!isLoading && !note && notes.length) {
      router.back();
    }
  }, [note, notes.length, isLoading, router]);

  const [cardIndex, setCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [noteComplete, setNoteComplete] = useState(false);
  const [cardOffset] = useState(new Animated.Value(0));
  const swipeThreshold = 80;

  useEffect(() => {
    setCardIndex(0);
    setShowBack(false);
    setNoteComplete(false);
  }, [note?.noteId]);

  useEffect(() => {
    setShowBack(false);
  }, [cardIndex]);

  const orderedCards = useMemo(() => {
    if (!note) {
      return [];
    }
    return note.cards
      .map((card, order) => {
        const key = `${note.noteId}::${card.id}`;
        const nextReview = reviewStates[key]?.nextReviewDate ?? null;
        return { card, order, nextReview };
      })
      .sort((a, b) => {
        const aTime = a.nextReview ? new Date(a.nextReview).getTime() : 0;
        const bTime = b.nextReview ? new Date(b.nextReview).getTime() : 0;
        if (aTime === bTime) {
          return a.order - b.order;
        }
        return aTime - bTime;
      });
  }, [note, reviewStates]);

  const totalCards = orderedCards.length;
  const currentCard = orderedCards[cardIndex]?.card ?? null;
  const isLastCard = totalCards > 0 && cardIndex === totalCards - 1;
  const isInReviewList = note ? reviewNoteIds.includes(note.noteId) : false;

  const finalizeSwipe = useCallback(
    (direction: "next" | "prev") => {
      Animated.timing(cardOffset, {
        toValue: direction === "next" ? -300 : 300,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        cardOffset.setValue(direction === "next" ? 300 : -300);
        Animated.timing(cardOffset, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    },
    [cardOffset]
  );

  const handleNextCard = useCallback(() => {
    if (!totalCards) {
      return;
    }
    if (cardIndex < totalCards - 1) {
      setCardIndex((prev) => prev + 1);
      setShowBack(false);
      finalizeSwipe("next");
    } else {
      setNoteComplete(true);
      setShowBack(false);
    }
  }, [cardIndex, totalCards, finalizeSwipe]);

  const handlePreviousCard = useCallback(() => {
    if (!totalCards || cardIndex === 0) {
      return;
    }
    setCardIndex((prev) => Math.max(0, prev - 1));
    setShowBack(false);
    finalizeSwipe("prev");
  }, [cardIndex, totalCards, finalizeSwipe]);

  const handleGestureEvent = Animated.event<
    PanGestureHandlerGestureEvent["nativeEvent"]
  >([{ nativeEvent: { translationX: cardOffset } }], { useNativeDriver: true });

  const handleGestureStateChange = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { translationX, state } = event.nativeEvent;
      if (state === GestureState.END || state === GestureState.CANCELLED) {
        if (translationX > swipeThreshold) {
          handlePreviousCard();
        } else if (translationX < -swipeThreshold) {
          handleNextCard();
        } else {
          Animated.spring(cardOffset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    },
    [cardOffset, handleNextCard, handlePreviousCard, swipeThreshold]
  );

  const logDifficulty = (difficulty: ReviewDifficulty) => {
    if (!note) {
      return;
    }
    orderedCards.forEach(({ card }) => {
      if (card.id) {
        reviewCard(note.noteId, card.id, difficulty);
      }
    });
    showNotification(
      `Logged ${difficulty} for ${note.topic || "this note"}`,
      "success"
    );
    router.back();
  };

  const toggleListMembership = () => {
    if (note) {
      toggleReviewNote(note.noteId);
    }
  };

  const renderBody = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      );
    }

    if (isLoading && !note) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading note…</Text>
        </View>
      );
    }

    if (!note) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Note not found.</Text>
        </View>
      );
    }

    if (!totalCards) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>This note has no cards yet.</Text>
        </View>
      );
    }

    const progressLabel = noteComplete
      ? "Review complete! How difficult was this note?"
      : `Card ${Math.min(cardIndex + 1, totalCards)} of ${totalCards}`;

    return (
      <View>
        <Text style={styles.statusText}>{progressLabel}</Text>
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleGestureStateChange}
        >
          <Animated.View style={{ transform: [{ translateX: cardOffset }] }}>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => setShowBack((prev) => !prev)}
            >
              <Text style={styles.cardLabel}>
                {showBack ? "Answer" : "Prompt"}
              </Text>
              <Text style={[styles.cardText, !showBack && styles.promptText]}>
                {showBack
                  ? currentCard?.back?.trim() || "No answer saved."
                  : currentCard?.front?.trim() || "No prompt saved."}
              </Text>
              {showBack && currentCard?.extra ? (
                <Text style={styles.extraText}>{currentCard.extra}</Text>
              ) : null}
              {currentCard?.tags?.length ? (
                <View style={styles.cardTagRow}>
                  {currentCard.tags.map((tag) => (
                    <View
                      key={`${currentCard.id}-${tag}`}
                      style={styles.cardTagPill}
                    >
                      <Text style={styles.cardTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
        {noteComplete ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.resultButton, styles.hardButton]}
              onPress={() => logDifficulty("hard")}
            >
              <Text style={styles.resultText}>Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultButton, styles.goodButton]}
              onPress={() => logDifficulty("good")}
            >
              <Text style={styles.resultText}>Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultButton, styles.easyButton]}
              onPress={() => logDifficulty("easy")}
            >
              <Text style={styles.resultText}>Easy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextCard}>
            <Text style={styles.nextButtonText}>
              {isLastCard ? "Finish review" : "Next card"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to stacks</Text>
        </TouchableOpacity>

        {note ? (
          <View>
            <Text style={styles.title}>{note.topic || "Untitled stack"}</Text>
            <Text style={styles.summaryText}>
              {note.summary || "No summary saved yet."}
            </Text>
            {noteTags.length ? (
              <View style={styles.tagRow}>
                {noteTags.slice(0, 4).map((tag) => (
                  <View key={`${note.noteId}-${tag}`} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={toggleListMembership}
            >
              <Text style={styles.secondaryLinkText}>
                {isInReviewList
                  ? "Remove from review list"
                  : "Add to review list"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}
