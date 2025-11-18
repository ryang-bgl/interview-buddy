import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useStores';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const {
    checkForMagicLink,
    completeMagicLinkSignIn,
    emailForSignIn,
    isLoading,
    error,
    clearError,
    setEmailForSignIn,
  } = useAuth();

  const [email, setEmail] = useState(
    typeof params.email === 'string' && params.email ? params.email : emailForSignIn || ''
  );
  const [code, setCode] = useState('');
  const [isCheckingLink, setIsCheckingLink] = useState(true);

  useEffect(() => {
    setEmail(prev => {
      if (emailForSignIn && emailForSignIn !== prev) {
        return emailForSignIn;
      }
      return prev;
    });
  }, [emailForSignIn]);

  useEffect(() => {
    const checkLink = async () => {
      const success = await checkForMagicLink();
      if (success) {
        router.replace('/(tabs)');
      }
      setIsCheckingLink(false);
    };

    checkLink();
  }, []);

  const clearErrorOnFocus = () => {
    if (error) {
      clearError();
    }
  };

  const handleVerify = async () => {
    if (!email || code.length < 4) {
      return;
    }

    const success = await completeMagicLinkSignIn(email.trim(), code.trim());
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleResend = () => {
    setEmailForSignIn(email.trim());
    router.replace('/(auth)/magic-login');
  };

  if (isCheckingLink || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking your session…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Enter Your Login Code</Text>
          <Text style={styles.subtitle}>
            Paste the 6-digit code we emailed you. If you tapped the link instead, we'll finish the
            sign-in automatically.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={clearErrorOnFocus}
              placeholder="your@email.com"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>6-digit Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={text => setCode(text.replace(/[^0-9]/g, ''))}
              onFocus={clearErrorOnFocus}
              placeholder="123456"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!email || code.length < 4) && styles.primaryButtonDisabled]}
            onPress={handleVerify}
            disabled={!email || code.length < 4 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResend}
          >
            <Text style={styles.secondaryButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Need help?</Text>
          <Text style={styles.tipText}>Codes expire in 1 hour and can only be used once.</Text>
          <Text style={styles.tipText}>If the code doesn't work, request a new one from the previous screen.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  headerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 42,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#ff7b72',
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1f2937',
    fontSize: 16,
  },
  codeInput: {
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#555',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  tipTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tipText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
});
