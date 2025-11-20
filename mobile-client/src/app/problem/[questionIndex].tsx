import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';

import { useQuestions } from '@/hooks/useStores';

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

  const question = useMemo(() => {
    if (!questionIndex) return null;
    return (
      questions.find(q => q.questionIndex === questionIndex) ||
      questions.find(q => q.id === questionIndex)
    );
  }, [questions, questionIndex]);

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
        <Text style={styles.title}>Unable to load details</Text>
        <Text style={styles.metaText}>{error}</Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Question not found</Text>
        <Text style={styles.metaText}>
          We couldn’t locate that saved question. Go back and refresh your list.
        </Text>
      </View>
    );
  }

  const tags = question.tags?.length
    ? question.tags
    : question.topicTags?.map(tag => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean) ?? [];

  useEffect(() => {
    if (question?.title) {
      navigation.setOptions({ title: question.title });
    }
  }, [navigation, question?.title]);

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{question.title}</Text>
      <Text style={styles.metaText}>Difficulty: {question.difficulty}</Text>
      <Text style={styles.metaText}>Question #{question.questionIndex || question.id}</Text>

      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map(tag => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.bodyText}>{question.description || 'No description saved.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Notes</Text>
        <Text style={styles.bodyText}>{question.note?.trim() || 'No personal notes yet.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Solution</Text>
        <Text style={styles.codeBlock}>{question.solution || 'No solution captured.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recommended Solution</Text>
        <Text style={styles.codeBlock}>{question.idealSolutionCode || 'Not available for this question.'}</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 20,
    gap: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metaText: {
    color: '#94A3B8',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  bodyText: {
    color: '#CBD5F5',
    lineHeight: 20,
  },
  codeBlock: {
    color: '#F8FAFC',
    backgroundColor: '#0B1220',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'monospace',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
