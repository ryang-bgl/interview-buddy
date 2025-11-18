import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Text, View } from '@/components/Themed';
import { useReview, useAppState } from '@/hooks/useStores';

export default function ReviewScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { dueForReview, completeReview, totalSolutions, reviewedToday } = useReview();
  const { showNotification, currentStreak } = useAppState();

  useEffect(() => {
    if (reviewedToday > 0) {
      // Streak already handled in store; keep hook to trigger streak upkeep if needed later.
    }
  }, [reviewedToday]);

  const handleReview = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (dueForReview.length === 0) return;

    const currentSolution = dueForReview[currentIndex];
    try {
      completeReview(currentSolution.id, difficulty);

      showNotification(
        `Great job! Solution reviewed. Current streak: ${currentStreak}`,
        'success'
      );

      if (currentIndex < dueForReview.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    } catch (error) {
      showNotification('Failed to update review status', 'error');
    }
  };

  if (dueForReview.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎉 All caught up!</Text>
        <Text style={styles.subtitle}>No solutions due for review right now.</Text>
        <Text style={styles.stats}>
          📊 Total Solutions: {totalSolutions} | Reviewed Today: {reviewedToday} | Streak: {currentStreak}
        </Text>
      </View>
    );
  }

  const currentSolution = dueForReview[currentIndex];

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review Time!</Text>
      <Text style={styles.progress}>
        {currentIndex + 1} of {dueForReview.length}
      </Text>

      <View style={styles.solutionCard}>
        <Text style={styles.problemTitle}>{currentSolution.title}</Text>
        <Text style={styles.problemNumber}>#{currentSolution.problemNumber}</Text>

        <View style={styles.codeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.code}>{currentSolution.code}</Text>
          </ScrollView>
        </View>

        <Text style={styles.reviewPrompt}>
          How difficult was it to recall this solution?
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.reviewButton, styles.easyButton]}
            onPress={() => handleReview('easy')}
          >
            <Text style={styles.buttonText}>Easy 😊</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reviewButton, styles.mediumButton]}
            onPress={() => handleReview('medium')}
          >
            <Text style={styles.buttonText}>Medium 🤔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reviewButton, styles.hardButton]}
            onPress={() => handleReview('hard')}
          >
            <Text style={styles.buttonText}>Hard 😅</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  progress: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
  },
  solutionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  problemNumber: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
  },
  codeContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  reviewPrompt: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  easyButton: {
    backgroundColor: '#4CAF50',
  },
  mediumButton: {
    backgroundColor: '#FF9800',
  },
  hardButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
