import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { register } from '@/src/api/auth';
import { formStyles as styles } from '@/src/styles/forms';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type FieldErrors = {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  function validate() {
    const errs: FieldErrors = {};
    if (!displayName.trim()) errs.displayName = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!isValidEmail(email.trim())) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function clearError(key: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleRegister() {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      const { data } = await register(displayName.trim(), email.trim(), password);
      setAuth(data.token, data.user.id);
      if (data.user.onboarding_complete) {
        router.replace('/(tabs)/chat');
      } else {
        router.replace('/(onboarding)');
      }
    } catch (err: any) {
      setApiError(
        err?.response?.status === 409
          ? 'An account with that email already exists'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.orbTopRight} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Text style={styles.mark}>✦</Text>
          <Text style={styles.wordmark}>Wick</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create account</Text>

          {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, fieldErrors.displayName ? styles.inputError : null]}
              value={displayName}
              onChangeText={(v) => { setDisplayName(v); clearError('displayName'); }}
              placeholder="Your name"
              placeholderTextColor="#6B6488"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />
            {fieldErrors.displayName ? (
              <Text style={styles.fieldError}>{fieldErrors.displayName}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, fieldErrors.email ? styles.inputError : null]}
              value={email}
              onChangeText={(v) => { setEmail(v); clearError('email'); }}
              placeholder="you@example.com"
              placeholderTextColor="#6B6488"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputError : null]}
              value={password}
              onChangeText={(v) => { setPassword(v); clearError('password'); }}
              placeholder="Min. 8 characters"
              placeholderTextColor="#6B6488"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={[styles.input, fieldErrors.confirmPassword ? styles.inputError : null]}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
              placeholder="••••••••"
              placeholderTextColor="#6B6488"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {fieldErrors.confirmPassword ? (
              <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.btn, loading ? styles.btnDisabled : null]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.btnText}>Create account</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
