import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EnrollmentStatus } from '@/src/types/api';

import { updateMe } from '@/src/api/users';
import { useUser } from '@/src/hooks/useUser';
import { tabScreenStyles as tabStyles } from '@/src/styles/tabs';
import { formStyles as styles } from '@/src/styles/forms';
import { Colors } from '@/constants/colors';

const ENROLLMENT_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'pre-major', label: 'Pre-major' },
  { value: 'in-major', label: 'In major' },
];

export default function EditProfileScreen() {
  const qc = useQueryClient();
  const { data: user, isLoading } = useUser();

  const initial = useMemo(() => {
    return {
      display_name: user?.display_name ?? '',
      major: user?.major ?? '',
      enrollment_status: (user?.enrollment_status ?? 'pre-major') as EnrollmentStatus,
      current_quarter: user?.current_quarter ?? '',
    };
  }, [user]);

  const [displayName, setDisplayName] = useState(initial.display_name);
  const [major, setMajor] = useState(initial.major);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>(initial.enrollment_status);
  const [currentQuarter, setCurrentQuarter] = useState(initial.current_quarter);
  const [apiError, setApiError] = useState('');

  // Keep form in sync when user finishes loading.
  useEffect(() => {
    setDisplayName(initial.display_name);
    setMajor(initial.major);
    setEnrollmentStatus(initial.enrollment_status);
    setCurrentQuarter(initial.current_quarter);
  }, [initial]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMe({
        display_name: displayName.trim() || undefined,
        major: major.trim() || null,
        enrollment_status: enrollmentStatus,
        current_quarter: currentQuarter.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user'] });
      router.back();
    },
    onError: () => {
      setApiError('Something went wrong. Please try again.');
    },
  });

  function handleSave() {
    setApiError('');

    // Design doc behavior: confirm when moving from pre-major -> in-major.
    if (user?.enrollment_status === 'pre-major' && enrollmentStatus === 'in-major') {
      Alert.alert(
        'Hide major goals?',
        'Switching to in-major will hide your major goal checklists. You can switch back at any time.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveMutation.mutate() },
        ],
      );
      return;
    }

    saveMutation.mutate();
  }

  if (isLoading || !user) {
    return (
      <SafeAreaView style={tabStyles.safe}>
        <View style={tabStyles.header}>
          <View style={tabStyles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={tabStyles.subtitle}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={tabStyles.title}>Edit Profile</Text>
            <View style={{ width: 48 }} />
          </View>
        </View>
        <View style={tabStyles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.orbTopRight} />

      <View style={tabStyles.header}>
        <View style={tabStyles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={tabStyles.subtitle}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={tabStyles.title}>Edit Profile</Text>
          <View style={{ width: 48 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Edit profile</Text>
          {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#6B6488"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Current quarter</Text>
            <TextInput
              style={styles.input}
              value={currentQuarter}
              onChangeText={setCurrentQuarter}
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
                  style={[
                    styles.segment,
                    enrollmentStatus === value ? styles.segmentActive : null,
                  ]}
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
              onSubmitEditing={handleSave}
            />
            <Text style={styles.helperText}>Shown on your Profile page and used for major advising.</Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, saveMutation.isPending ? styles.btnDisabled : null]}
            onPress={handleSave}
            disabled={saveMutation.isPending}
            activeOpacity={0.85}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
