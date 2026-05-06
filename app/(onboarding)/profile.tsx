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
import { updateMe } from '@/src/api/users';
import { formStyles as styles } from '@/src/styles/forms';
import type { EnrollmentStatus } from '@/src/types/api';

const ENROLLMENT_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'pre-major', label: 'Pre-major' },
  { value: 'in-major', label: 'In major' },
];

export default function ProfileSetupScreen() {
  const [quarter, setQuarter] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('pre-major');
  const [major, setMajor] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setApiError('');
    setLoading(true);
    try {
      await updateMe({
        current_quarter: quarter.trim() || null,
        enrollment_status: enrollmentStatus,
        major: major.trim() || null,
      });
      router.push('/(onboarding)/notifications');
    } catch {
      setApiError('Something went wrong. Please try again.');
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
          <Text style={styles.heading}>Set up your profile</Text>

          {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Current quarter</Text>
            <TextInput
              style={styles.input}
              value={quarter}
              onChangeText={setQuarter}
              placeholder="e.g. Spring 2026"
              placeholderTextColor="#6B6488"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Enrollment status</Text>
            <View style={styles.segmentedRow}>
              {ENROLLMENT_OPTIONS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.segment, enrollmentStatus === value ? styles.segmentActive : null]}
                  onPress={() => setEnrollmentStatus(value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      enrollmentStatus === value ? styles.segmentTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={styles.input}
              value={major}
              onChangeText={setMajor}
              placeholder="e.g. Informatics"
              placeholderTextColor="#6B6488"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            <Text style={styles.helperText}>You can add this later</Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading ? styles.btnDisabled : null]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.btnText}>Continue</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
