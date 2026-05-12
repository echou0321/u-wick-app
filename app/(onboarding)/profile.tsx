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
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { updateMe } from '@/src/api/users';
import { createMajorGoal } from '@/src/api/goals';
import { useMajors } from '@/src/hooks/useMajors';
import { formStyles as styles } from '@/src/styles/forms';
import { tabScreenStyles as tabStyles } from '@/src/styles/tabs';
import type { EnrollmentStatus, Major } from '@/src/types/api';

const ENROLLMENT_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'pre-major', label: 'Pre-major' },
  { value: 'in-major', label: 'In major' },
];

export default function ProfileSetupScreen() {
  const [quarter, setQuarter] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('pre-major');
  const [major, setMajor] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: majors, isLoading: majorsLoading, isError: majorsError } = useMajors();

  function handleSelectEnrollment(value: EnrollmentStatus) {
    setEnrollmentStatus(value);
    setMajor('');
    setSelectedMajor(null);
  }

  async function handleContinue() {
    setApiError('');
    setLoading(true);
    try {
      const majorValue =
        enrollmentStatus === 'in-major'
          ? major.trim() || null
          : selectedMajor?.major_name ?? null;

      await updateMe({
        current_quarter: quarter.trim() || null,
        enrollment_status: enrollmentStatus,
        major: majorValue,
      });

      if (enrollmentStatus === 'pre-major' && selectedMajor) {
        await createMajorGoal(selectedMajor.id).catch(() => {});
      }

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
                  onPress={() => handleSelectEnrollment(value)}
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

          {enrollmentStatus === 'in-major' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Your major</Text>
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
              <Text style={styles.helperText}>You can update this later</Text>
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Target major</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                ]}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: selectedMajor ? '#E8E3FF' : '#6B6488',
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 16,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {selectedMajor ? selectedMajor.major_name : 'Select your target major'}
                </Text>
                <Text style={{ color: '#6B6488', marginLeft: 8 }}>›</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>You can change this later</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading ? styles.btnDisabled : null]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView style={tabStyles.safe}>
          <View style={[tabStyles.header, tabStyles.headerRow]}>
            <Text style={tabStyles.title}>Choose a major</Text>
            <Pressable onPress={() => setPickerOpen(false)}>
              <Text style={tabStyles.subtitle}>✕ Close</Text>
            </Pressable>
          </View>

          {majorsLoading ? (
            <View style={tabStyles.centered}>
              <ActivityIndicator size="large" color="#C4B8FF" />
            </View>
          ) : majorsError ? (
            <View style={tabStyles.centered}>
              <Text style={tabStyles.placeholder}>Could not load majors.</Text>
            </View>
          ) : (
            <FlatList
              data={(majors ?? []).slice().sort((a, b) => a.major_name.localeCompare(b.major_name))}
              keyExtractor={(m) => m.id}
              contentContainerStyle={tabStyles.profileBody}
              renderItem={({ item }) => (
                <Pressable
                  style={tabStyles.rowBtn}
                  onPress={() => {
                    setSelectedMajor(item);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select major ${item.major_name}`}
                >
                  <Text style={tabStyles.rowLabel}>{item.major_name}</Text>
                  <Text style={tabStyles.rowValue}>›</Text>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
