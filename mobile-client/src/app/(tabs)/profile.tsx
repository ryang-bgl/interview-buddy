import { StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Text, View } from "@/components/Themed";
import {
  useAuth,
  useSolutions,
  useSyncStatus,
  useAppState,
} from "@/hooks/useStores";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { solutions, getDueForReview } = useSolutions();
  const { syncStatus, sync, canSync } = useSyncStatus();
  const { currentStreak } = useAppState();

  const dueForReview = getDueForReview();
  const totalSolutions = solutions.length;

  // Calculate stats from solutions
  const reviewedToday = solutions.filter((s) => {
    if (!s.lastReviewedAt) return false;
    const today = new Date().toDateString();
    return new Date(s.lastReviewedAt).toDateString() === today;
  }).length;

  const totalReviews = solutions.reduce((total, solution) => {
    return total + solution.repetitions;
  }, 0);

  const averageEaseFactor =
    solutions.length > 0
      ? solutions.reduce((sum, s) => sum + s.easeFactor, 0) / solutions.length
      : 2.5;

  const lastReviewDate = solutions
    .filter((s) => s.lastReviewedAt)
    .sort(
      (a, b) =>
        new Date(b.lastReviewedAt!).getTime() -
        new Date(a.lastReviewedAt!).getTime()
    )[0]?.lastReviewedAt;

  const handleSync = async () => {
    try {
      await sync();
      Alert.alert("Success", "Successfully synced with server!");
    } catch (error) {
      Alert.alert("Sync Failed", "Failed to sync with server");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return date.toLocaleDateString();
  };

  const getDifficultyColor = (easeFactor: number) => {
    if (easeFactor >= 2.8) return "#4CAF50"; // Green - Easy
    if (easeFactor >= 2.2) return "#FF9800"; // Orange - Medium
    return "#F44336"; // Red - Hard
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Profile</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />

      <View style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Account</Text>
          <View style={styles.userInfoCard}>
            <Text style={styles.userName}>
              {user?.displayName || user?.username}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Learning Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalSolutions}</Text>
              <Text style={styles.statLabel}>Total Solutions</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{dueForReview.length}</Text>
              <Text style={styles.statLabel}>Due for Review</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalReviews}</Text>
              <Text style={styles.statLabel}>Total Reviews</Text>
            </View>
          </View>

          <View style={styles.detailStats}>
            <Text style={styles.detailStat}>
              Last Review: {formatDate(lastReviewDate)}
            </Text>
            <Text style={styles.detailStat}>
              Reviewed Today: {reviewedToday}
            </Text>
            <View style={styles.easeFactorContainer}>
              <Text style={styles.detailStat}>Average Ease Factor:</Text>
              <View
                style={[
                  styles.easeFactorBadge,
                  { backgroundColor: getDifficultyColor(averageEaseFactor) },
                ]}
              >
                <Text style={styles.easeFactorText}>
                  {averageEaseFactor.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>

          <TouchableOpacity
            style={[
              styles.button,
              (!canSync || syncStatus === "syncing") && styles.buttonDisabled,
            ]}
            onPress={handleSync}
            disabled={!canSync || syncStatus === "syncing"}
          >
            <Text style={styles.buttonText}>
              {syncStatus === "syncing" ? "Syncing..." : "Sync with Server"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Notification Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.buttonText, styles.logoutButtonText]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <Text style={styles.aboutText}>
            This app uses spaced repetition (FSR) to help you review and retain
            your LeetCode solutions. The algorithm adjusts review intervals
            based on how well you remember each solution.
          </Text>
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
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  detailStats: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
  },
  detailStat: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  easeFactorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  easeFactorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  easeFactorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  userInfoCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    marginTop: 10,
  },
  logoutButtonText: {
    fontWeight: "600",
  },
});
