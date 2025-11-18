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
  const canSubmitCode = trimmedCode.length >= 6;

  const clearErrorOnFocus = () => {
    if (error) {
      clearError();
    }
  };

  const handleSendCode = async () => {
    if (!isEmailValid) {
      return;
    }

    const success = await sendMagicLink(trimmedEmail);
    if (success) {
      setStep("code");
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
        We'll text you a 6-digit code so you can hop back into the app.
      </Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        onFocus={clearErrorOnFocus}
        placeholder="you@example.com"
        placeholderTextColor="#475569"
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
        <View>
          <Text style={styles.sectionTitle}>Enter the 6-digit code</Text>
          <Text style={styles.sectionSubtitle}>
            Copy the code from your inbox to finish signing in.
          </Text>
        </View>
        <TouchableOpacity onPress={handleEditEmail}>
          <Text style={styles.sectionLink}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emailPill}>
        <Feather name="mail" size={16} color="#38BDF8" />
        <Text style={styles.emailPillText}>{trimmedEmail}</Text>
      </View>

      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\s/g, ""))}
        onFocus={clearErrorOnFocus}
        keyboardType="number-pad"
        placeholder="000000"
        placeholderTextColor="#334155"
        maxLength={6}
        editable={!isLoading}
      />

      <Text style={styles.helperText}>
        Codes expire after an hour. Make sure you paste the exact 6 digits we
        emailed you.
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
          <Text style={styles.primaryButtonText}>Verify & continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        <Feather name="refresh-cw" size={16} color="#38BDF8" />
        <Text style={styles.resendText}>Resend code</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="zap" size={22} color="#38BDF8" />
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSubtitle}>
            Sign in with a quick one-time code and pick up where you left off.
          </Text>
        </View>

        <View style={styles.card}>
          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#F87171" />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#082F49",
    borderWidth: 1,
    borderColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#0B1120",
    borderRadius: 24,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#FCA5A5",
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionLink: {
    color: "#38BDF8",
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#F8FAFC",
    backgroundColor: "#0F172A",
  },
  codeInput: {
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 16,
    textAlign: "center",
    color: "#F8FAFC",
    backgroundColor: "#020617",
  },
  helperText: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#1D4ED8",
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
    color: "#38BDF8",
    fontWeight: "600",
  },
  footerNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  footerLink: {
    color: "#38BDF8",
    fontWeight: "600",
  },
  altLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  altText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  emailPillText: {
    color: "#E2E8F0",
    fontWeight: "600",
    fontSize: 14,
  },
});
