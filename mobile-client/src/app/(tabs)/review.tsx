import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';

import { useAppState, useQuestions } from '@/hooks/useStores';
import { ReviewDifficulty } from '@/config/spacedRepetition';

const cardSteps = ['description', 'saved', 'ai'] as const;
type CardStep = (typeof cardSteps)[number];

const stepTitles: Record<CardStep, string> = {
  description: 'Problem Description',
  saved: 'Your Saved Solution',
  ai: 'Recommended Solution',
};

export default function ReviewScreen() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const { showNotification } = useAppState();
  const {
    questions,
    reviewStates,
    isLoading,
    error,
    loadQuestions,
    getDueQuestions,
    reviewQuestion,
    hasAttemptedInitialSync,
  } = useQuestions();

  useEffect(() => {
    if (!hasAttemptedInitialSync && !isLoading) {
      loadQuestions();
    }
  }, [hasAttemptedInitialSync, isLoading, loadQuestions]);

  const dueQuestions = useMemo(() => getDueQuestions(), [questions, reviewStates, getDueQuestions]);
  const currentQuestion = dueQuestions[questionIndex];

  const handleNextStep = () => {
    if (!currentQuestion) return;
    if (stepIndex < cardSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      const nextIndex = (questionIndex + 1) % dueQuestions.length;
      setQuestionIndex(nextIndex);
      setStepIndex(0);
    }
  };

  const handleReview = (difficulty: ReviewDifficulty) => {
    if (!currentQuestion) return;
    const questionKey = currentQuestion.questionIndex || currentQuestion.id;
    reviewQuestion(questionKey, difficulty);
    showNotification(`Logged ${difficulty} review`, 'success');

    const refreshedDue = getDueQuestions();
    if (refreshedDue.length === 0) {
      setQuestionIndex(0);
    } else {
      const nextIndex = questionIndex >= refreshedDue.length ? 0 : questionIndex;
      setQuestionIndex(nextIndex);
    }
    setStepIndex(0);
  };

  if (isLoading && !hasAttemptedInitialSync) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.subtitle}>Loading questions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Unable to load reminders</Text>
        <Text style={styles.subtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>🎉 All questions reviewed!</Text>
        <Text style={styles.subtitle}>No saved questions due for review right now.</Text>
      </View>
    );
  }

  const currentStep = cardSteps[stepIndex];

  const renderBody = () => {
    switch (currentStep) {
      case 'description':
        return (
          <Text style={styles.bodyText}>{currentQuestion.description || 'No description available.'}</Text>
        );
      case 'saved':
        return (
          <Text style={styles.bodyText}>{currentQuestion.note?.trim() || currentQuestion.solution || 'No saved solution yet.'}</Text>
        );
      case 'ai':
        return (
          <Text style={styles.bodyText}>{currentQuestion.idealSolutionCode || 'AI recommendation unavailable.'}</Text>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Question Review</Text>
      <Text style={styles.progress}>
        {questionIndex + 1} of {dueQuestions.length}
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.problemTitle}>{currentQuestion.title}</Text>
          <Text style={styles.problemMeta}>#{currentQuestion.questionIndex || currentQuestion.id}</Text>
        </View>
        <Text style={styles.stepLabel}>{stepTitles[currentStep]}</Text>
        <View style={styles.cardBody}>{renderBody()}</View>

        <View style={styles.navigationRow}>
          <TouchableOpacity style={styles.navButton} onPress={handleNextStep}>
            <Text style={styles.navButtonText}>
              {stepIndex === cardSteps.length - 1 ? 'Next Question →' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.reviewPrompt}>How did this question feel?</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.reviewButton, styles.hardButton]}
          onPress={() => handleReview('hard')}
        >
          <Text style={styles.buttonText}>Hard (Again)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reviewButton, styles.mediumButton]}
          onPress={() => handleReview('good')}
        >
          <Text style={styles.buttonText}>Good</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reviewButton, styles.easyButton]}
          onPress={() => handleReview('easy')}
        >
          <Text style={styles.buttonText}>Easy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  progress: {
    fontSize: 14,
    color: '#CBD5F5',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 12,
  },
  problemMeta: {
    fontSize: 14,
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A5B4FC',
  },
  cardBody: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
  },
  bodyText: {
    color: '#E2E8F0',
    lineHeight: 20,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewPrompt: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  easyButton: {
    backgroundColor: '#22C55E',
  },
  mediumButton: {
    backgroundColor: '#F59E0B',
  },
  hardButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
