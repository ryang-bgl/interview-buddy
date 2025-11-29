import React, { useEffect, useMemo, useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text } from "@/components/Themed";

import { useQuestions } from "@/hooks/useStores";

export default function ProblemDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { questionIndex } = useLocalSearchParams<{ questionIndex: string }>();
  const {
    questions,
    loadQuestions,
    isLoading,
    error,
    hasAttemptedInitialSync,
  } = useQuestions();

  useEffect(() => {
    if (!hasAttemptedInitialSync && !isLoading) {
      loadQuestions();
    }
  }, [hasAttemptedInitialSync, isLoading, loadQuestions]);

  const sortedQuestions = useMemo(() => {
    return questions.slice().sort((a, b) => {
      const numA = Number(a.questionIndex) || 0;
      const numB = Number(b.questionIndex) || 0;
      if (numA === numB) {
        return (a.title || "").localeCompare(b.title || "");
      }
      return numA - numB;
    });
  }, [questions]);

  const question = useMemo(() => {
    if (!questionIndex) return null;
    return (
      sortedQuestions.find(
        (q) => q.questionIndex === questionIndex || q.id === questionIndex
      ) ?? null
    );
  }, [sortedQuestions, questionIndex]);

  const currentIdentifier = question?.questionIndex || question?.id || null;

  const currentIndex = useMemo(() => {
    if (!currentIdentifier) return -1;
    return sortedQuestions.findIndex(
      (q) => (q.questionIndex || q.id) === currentIdentifier
    );
  }, [sortedQuestions, currentIdentifier]);

  const previousQuestion =
    currentIndex > 0 ? sortedQuestions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex !== -1 && currentIndex + 1 < sortedQuestions.length
      ? sortedQuestions[currentIndex + 1]
      : null;

  const navigateToQuestion = useCallback(
    (target?: { questionIndex?: string | null; id?: string | null }) => {
      if (!target) return;
      const targetIdentifier = target.questionIndex || target.id;
      if (!targetIdentifier) {
        return;
      }
      router.replace({
        pathname: "/problem/[questionIndex]",
        params: { questionIndex: targetIdentifier },
      });
    },
    [router]
  );

  if (isLoading && !hasAttemptedInitialSync) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.metaText}>Loading question…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text>Unable to load details</Text>
        <Text style={styles.metaText}>{error}</Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.centerContainer}>
        <Text>Question not found</Text>
        <Text style={styles.metaText}>
          We couldn’t locate that saved question. Go back and refresh your list.
        </Text>
      </View>
    );
  }

  const tags = question.tags?.length
    ? question.tags
    : question.topicTags
        ?.map((tag) =>
          typeof tag === "string"
            ? tag
            : tag
            ? (tag as { name?: string }).name
            : ""
        )
        .filter(Boolean) ?? [];

  useEffect(() => {
    if (question?.title) {
      navigation.setOptions({ title: question.title });
    }
  }, [navigation, question?.title]);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.heading}>{question.title}</Text>
      <Text style={styles.metaText}>Difficulty: {question.difficulty}</Text>
      <Text style={styles.metaText}>
        Question #{question.questionIndex || question.id}
      </Text>

      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.bodyText}>
          {question.description || "No description saved."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Notes</Text>
        <Text style={styles.bodyText}>
          {question.note?.trim() || "No personal notes yet."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Solution</Text>
        <Text style={styles.codeBlock}>
          {question.solution || "No solution captured."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recommended Solution</Text>
        <Text style={styles.codeBlock}>
          {question.idealSolutionCode || "Not available for this question."}
        </Text>
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={[
            styles.navButton,
            !previousQuestion && styles.navButtonDisabled,
          ]}
          disabled={!previousQuestion}
          onPress={() => navigateToQuestion(previousQuestion ?? undefined)}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
          {previousQuestion ? (
            <Text style={styles.navMetaText} numberOfLines={1}>
              {previousQuestion.title}
            </Text>
          ) : (
            <Text style={styles.navMetaText}>No earlier problem</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, !nextQuestion && styles.navButtonDisabled]}
          disabled={!nextQuestion}
          onPress={() => navigateToQuestion(nextQuestion ?? undefined)}
        >
          <Text style={styles.navButtonText}>Next →</Text>
          {nextQuestion ? (
            <Text style={styles.navMetaText} numberOfLines={1}>
              {nextQuestion.title}
            </Text>
          ) : (
            <Text style={styles.navMetaText}>No more problems</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to list</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  container: {
    padding: 20,
    gap: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0F172A",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  metaText: {
    color: "#94A3B8",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    color: "#E2E8F0",
    fontSize: 12,
  },
  section: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  bodyText: {
    color: "#CBD5F5",
    lineHeight: 20,
  },
  codeBlock: {
    color: "#F8FAFC",
    backgroundColor: "#0B1220",
    borderRadius: 8,
    padding: 12,
    fontFamily: "monospace",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  navMetaText: {
    color: "#94A3B8",
    fontSize: 12,
  },
});
