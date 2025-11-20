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

const CODE_LENGTH = 8;

export default function MagicLoginScreen() {
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
  const canSubmitCode = trimmedCode.length >= CODE_LENGTH;

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
    } else {
      setCode("");
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

  const primaryActionDisabled =
    isLoading || (step === "email" ? !isEmailValid : !canSubmitCode);

  const renderCodeSection = () => (
    <View style={styles.codeSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Enter your code</Text>
        <TouchableOpacity onPress={handleEditEmail}>
          <Text style={styles.sectionLink}>Change email</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionSubtitle}>
        Paste the 8-digit code we just sent to {trimmedEmail}.
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
        maxLength={CODE_LENGTH}
        autoFocus={Platform.OS === "web"}
      />

      <Text style={styles.helperText}>
        Codes expire in one hour. Can't find the email? Check spam or promotions
        tabs.
      </Text>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        <Feather name="refresh-cw" size={16} color="#2563EB" />
        <Text style={styles.resendText}>Resend code</Text>
      </TouchableOpacity>
    </View>
  );

  const primaryButtonLabel = step === "email" ? "Send login code" : "Login";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Sign in to LeetStack</Text>
            <Text style={styles.heroSubtitle}>
              We'll email you a one-time code so you can log in without a
              password.
            </Text>
          </View>

          <View style={styles.card}>
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={18} color="#B91C1C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Work email</Text>
              <Text style={styles.sectionSubtitle}>
                We'll send an 8-digit code to this address.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  step === "code" && styles.inputDisabled,
                ]}
                value={email}
                onChangeText={setEmail}
                onFocus={clearErrorOnFocus}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && step === "email"}
              />
            </View>

            {step === "code" && renderCodeSection()}

            <TouchableOpacity
              style={[styles.primaryButton, primaryActionDisabled && styles.primaryButtonDisabled]}
              onPress={step === "email" ? handleSendCode : handleVerifyCode}
              disabled={primaryActionDisabled}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>Have a password instead?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in with password</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>Need an account?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Create one</Text>
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
    justifyContent: "center",
    padding: 24,
    gap: 20,
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
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#B91C1C",
    flex: 1,
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionSubtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLink: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
  },
  inputDisabled: {
    backgroundColor: "#F1F5F9",
    color: "#94A3B8",
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
  codeSection: {
    gap: 14,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
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
  codeInput: {
    backgroundColor: "#F8FAFC",
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
  },
  helperText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resendText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    color: "#475569",
    fontSize: 13,
  },
  footerLink: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
  },
});
