import React, { useState } from 'react';
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
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/useStores';

export default function MagicLoginScreen() {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { sendMagicLink, isLoading, error, clearError } = useAuth();

  const handleSendMagicLink = async () => {
    if (!email) {
      return;
    }

    const success = await sendMagicLink(email);
    if (success) {
      setEmailSent(true);
    }
  };

  const clearErrorOnFocus = () => {
    if (error) {
      clearError();
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    clearError();
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code and login link to{'\n'}<Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.instructionText}>Check your email inbox</Text>
            </View>

            <View style={styles.instructionItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.instructionText}>Grab the one-time code in the email</Text>
            </View>

            <View style={styles.instructionItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.instructionText}>Enter the code here to complete sign in</Text>
            </View>
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>📋 Note</Text>
            <Text style={styles.noteText}>
              Codes expire in 1 hour. If you don't see the email, check spam or the promotions tab.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push({ pathname: '/(auth)/verify', params: { email } })}
            >
              <Text style={styles.secondaryButtonText}>Enter Code Manually</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleSendMagicLink()}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Resend Code</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.backContainer}>
            <Text style={styles.backText}>Need to try a different email? </Text>
            <TouchableOpacity onPress={handleTryAgain}>
              <Text style={styles.backLink}>Start over</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.alternativeContainer}>
            <Text style={styles.alternativeText}>Prefer using a password? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.alternativeLink}>Sign in with password</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.magicIcon}>✨</Text>
          <Text style={styles.title}>Passwordless Email Login</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a one-time code (and login link) to sign in instantly
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
              placeholder="Enter your email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!email || isLoading) && styles.primaryButtonDisabled]}
            onPress={handleSendMagicLink}
            disabled={!email || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Send Magic Link</Text>
            )}
          </TouchableOpacity>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Passwordless?</Text>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔒</Text>
              <Text style={styles.benefitText}>More secure than passwords</Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>Codes arrive in seconds</Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🧠</Text>
              <Text style={styles.benefitText}>No passwords to remember</Text>
            </View>
          </View>

          <View style={styles.alternativeContainer}>
            <Text style={styles.alternativeText}>Already have a code? </Text>
            <Link href="/(auth)/verify" asChild>
              <TouchableOpacity>
                <Text style={styles.alternativeLink}>Enter it here</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.passwordPrompt}>
            <Text style={styles.alternativeText}>Prefer using a password? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.alternativeLink}>Sign in with password</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  magicIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emailText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
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
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  noteContainer: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  noteTitle: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    color: '#888',
    fontSize: 16,
  },
  alternativeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alternativeText: {
    color: '#888',
    fontSize: 14,
  },
  alternativeLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#888',
    fontSize: 14,
  },
  signupLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#888',
    fontSize: 14,
  },
  backLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
