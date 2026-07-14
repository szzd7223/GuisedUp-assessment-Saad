import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginSignupScreen() {
  const { login, register, loading, error: authError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local validation error
  const [localError, setLocalError] = useState('');

  const validateEmail = (val) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(val);
  };

  const handleSubmit = async () => {
    setLocalError('');

    if (isRegister) {
      if (!name.trim()) return setLocalError('Name is required');
      if (!email.trim()) return setLocalError('Email is required');
      if (!validateEmail(email)) return setLocalError('Please enter a valid email address');
      if (password.length < 8) return setLocalError('Password must be at least 8 characters long');
      if (password !== confirmPassword) return setLocalError('Passwords do not match');

      const result = await register(name, email, password);
      if (!result.success) {
        setLocalError(result.error);
      }
    } else {
      if (!email.trim()) return setLocalError('Email is required');
      if (!validateEmail(email)) return setLocalError('Please enter a valid email address');
      if (!password) return setLocalError('Password is required');

      const result = await login(email, password);
      if (!result.success) {
        setLocalError(result.error);
      }
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setLocalError('');
    setPassword('');
    setConfirmPassword('');
  };

  const displayError = localError || authError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Logo / Title */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🛡️</Text>
            <Text style={styles.logoText}>GuisedUp</Text>
            <Text style={styles.logoSubtext}>The authentic-first social space.</Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, !isRegister && styles.activeTab]}
              onPress={() => isRegister && toggleMode()}
            >
              <Text style={[styles.tabText, !isRegister && styles.activeTabText]}>Login</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, isRegister && styles.activeTab]}
              onPress={() => !isRegister && toggleMode()}
            >
              <Text style={[styles.tabText, isRegister && styles.activeTabText]}>Sign Up</Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.fieldIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#A19EAB"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.fieldIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#A19EAB"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.fieldIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#A19EAB"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.fieldIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor="#A19EAB"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Error Message */}
            {displayError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {displayError}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            {/* Sub-label switch */}
            <Pressable onPress={toggleMode} style={styles.toggleFooter}>
              <Text style={styles.toggleFooterText}>
                {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  logoSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  toggleFooterText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
});
