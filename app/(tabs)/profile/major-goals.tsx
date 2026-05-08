import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { tabScreenStyles as styles } from '@/src/styles/tabs';
import { useMajorGoals } from '@/src/hooks/useMajorGoals';
import { useMajors } from '@/src/hooks/useMajors';
import { createMajorGoal, dropOrAchieveMajorGoal, type MajorGoalRow } from '@/src/api/goals';
import { logEvent } from '@/src/api/sessions';

function fmtDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export default function MajorGoalsScreen() {
  const qc = useQueryClient();
  const {
    data: goals,
    isLoading: goalsLoading,
    isError: goalsError,
  } = useMajorGoals('active');

  const {
    data: majors,
    isLoading: majorsLoading,
    isError: majorsError,
  } = useMajors();

  const [pickerOpen, setPickerOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: ({ majorReqId }: { majorReqId: string }) =>
      createMajorGoal(majorReqId),
    onSuccess: (created: any) => {
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'active'] });
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'all'] });
      setPickerOpen(false);
      logEvent('major_goal_set', { goal_id: created?.id }).catch(() => {});
      const createdId = created?.id;
      if (createdId) {
        router.push(`/(tabs)/profile/major-goals/${createdId}`);
      }
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        'Could not create major goal. Try again.';

      Alert.alert(
        'Add major goal failed',
        `HTTP ${status ?? '—'}\n${msg}\n${data ? JSON.stringify(data) : ''}`.trim(),
      );
      // Also log for debugging (visible in dev logs).
      // eslint-disable-next-line no-console
      console.error('createMajorGoal failed', err);
    },
  });

  const dropMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: 'dropped' | 'achieved' }) =>
      dropOrAchieveMajorGoal(goalId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'active'] });
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'all'] });
    },
  });

  const goalsList: MajorGoalRow[] = useMemo(() => goals ?? [], [goals]);

  if (goalsLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C4B8FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (goalsError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.placeholder}>Could not load major goals.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={{ paddingRight: 16 }}>
            <Text style={styles.subtitle}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Major Goals</Text>
          <View style={{ width: 48 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.profileBody}>
        {goalsList.length === 0 ? (
          <View style={styles.listCard}>
            <Text style={styles.placeholder}>No active major goals yet.</Text>
            <Pressable
              style={styles.rowBtn}
              onPress={() => setPickerOpen(true)}
              disabled={majorsLoading || !!majorsError}
            >
              <Text style={styles.rowLabel}>Add major goal</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
          </View>
        ) : (
          goalsList.map((g) => (
            <View key={g.id} style={styles.listCard}>
              <View style={styles.rowStatic}>
                <Text style={styles.rowLabel}>{g.major_name}</Text>
                <Text style={styles.rowValue}>{fmtDate(g.application_deadline)}</Text>
              </View>
              <View style={styles.rowStatic}>
                <Text style={styles.rowLabel}>Department</Text>
                <Text style={styles.rowValue}>{g.department ?? '—'}</Text>
              </View>

              <Pressable
                style={styles.rowBtn}
                onPress={() => router.push(`/(tabs)/profile/major-goals/${g.id}`)}
              >
                <Text style={styles.rowLabel}>View checklist</Text>
                <Text style={styles.rowValue}>›</Text>
              </Pressable>

              <Pressable
                style={styles.rowBtn}
                onPress={() => {
                  Alert.alert('Drop goal?', 'This will drop your active major goal.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Drop',
                      style: 'destructive',
                      onPress: () => dropMutation.mutate({ goalId: g.id, status: 'dropped' }),
                    },
                  ]);
                }}
              >
                <Text style={styles.rowLabel}>Drop</Text>
                <Text style={styles.rowValue}>—</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.header, styles.headerRow]}>
            <Text style={styles.title}>Choose a major</Text>
            <Pressable onPress={() => setPickerOpen(false)}>
              <Text style={styles.rowValue}>✕ Close</Text>
            </Pressable>
          </View>

          {majorsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#C4B8FF" />
            </View>
          ) : majorsError ? (
            <View style={styles.centered}>
              <Text style={styles.placeholder}>Could not load majors.</Text>
            </View>
          ) : (
            <FlatList
              data={(majors ?? []).slice().sort((a, b) => a.major_name.localeCompare(b.major_name))}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.profileBody}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.rowBtn,
                    createMutation.isPending ? { opacity: 0.6 } : null,
                  ]}
                  onPress={() => {
                    createMutation.mutate({ majorReqId: item.id });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select major ${item.major_name}`}
                >
                  <Text style={styles.rowLabel}>{item.major_name}</Text>
                  <Text style={styles.rowValue}>›</Text>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
