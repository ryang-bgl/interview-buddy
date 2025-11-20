import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Link, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "@/hooks/useStores";

type Step = "email" | "code";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");

  const {
    sendMagicLink,
    completeMagicLinkSignIn,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const trimmedEmail = email.trim();
  const trimmedCode = code.trim();
  const isEmailValid = useMemo(
    () => /.+@.+\..+/.test(trimmedEmail),
    [trimmedEmail]
  );
  const canSubmitCode = trimmedCode.length >= 8;

  const clearErrorOnFocus = () => {
    if (error) {
      clearError();
    }
  };

  const handleSendCode = async () => {
    if (!isEmailValid) {
      return;
    }

    setStep("code");
    const success = await sendMagicLink(trimmedEmail);
    if (!success) {
      setStep("email");
    }
  };

  const handleVerifyCode = async () => {
    if (!canSubmitCode) {
      return;
    }

    const success = await completeMagicLinkSignIn(trimmedEmail, trimmedCode);
    if (success) {
      router.replace("/(tabs)");
    }
  };

  const handleEditEmail = () => {
    setStep("email");
    setCode("");
    clearError();
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.sectionTitle}>Sign in with email</Text>
      <Text style={styles.sectionSubtitle}>
        We'll email you an 8-digit code to quickly get you logged in.
      </Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        onFocus={clearErrorOnFocus}
        placeholder="you@example.com"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!isEmailValid || isLoading) && styles.primaryButtonDisabled,
        ]}
        onPress={handleSendCode}
        disabled={!isEmailValid || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Send login code</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Enter your code</Text>
        <TouchableOpacity onPress={handleEditEmail}>
          <Text style={styles.sectionLink}>Change email</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionSubtitle}>
        Paste the 8-digit code from {trimmedEmail || "your inbox"} to finish
        signing in.
      </Text>

      <View style={styles.emailPill}>
        <Feather name="mail" size={16} color="#2563EB" />
        <Text style={styles.emailPillText}>{trimmedEmail}</Text>
      </View>

      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\s/g, ""))}
        onFocus={clearErrorOnFocus}
        keyboardType="number-pad"
        placeholder="00000000"
        placeholderTextColor="#94A3B8"
        maxLength={8}
        editable={!isLoading}
      />

      <Text style={styles.helperText}>
        Codes expire after an hour. Make sure to enter all 8 digits exactly as
        shown in the email.
      </Text>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!canSubmitCode || isLoading) && styles.primaryButtonDisabled,
        ]}
        onPress={handleVerifyCode}
        disabled={!canSubmitCode || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        <Feather name="refresh-cw" size={16} color="#2563EB" />
        <Text style={styles.resendText}>Resend code</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Welcome back 👋</Text>
            <Text style={styles.heroSubtitle}>
              Sign in with a quick one-time code to pick up where you left off.
            </Text>
          </View>

          <View style={styles.card}>
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === "email" ? renderEmailStep() : renderCodeStep()}
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerText}>Need an account?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.altLink}>
            <Text style={styles.altText}>Have a link instead?</Text>
            <Link href="/(auth)/magic-login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Open magic login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    gap: 24,
  },
  hero: {
    alignItems: "center",
    gap: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    gap: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#B91C1C",
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionSubtitle: {
    color: "#475569",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  sectionLink: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  codeInput: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 12,
    textAlign: "center",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  helperText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  resendText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  footerNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    color: "#475569",
    fontSize: 14,
  },
  footerLink: {
    color: "#2563EB",
    fontWeight: "600",
  },
  altLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  altText: {
    color: "#94A3AF",
    fontSize: 14,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  emailPillText: {
    color: "#1D4ED8",
    fontWeight: "600",
    fontSize: 14,
  },
});
