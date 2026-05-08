import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { Major } from '@/src/types/api';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

import { tabScreenStyles as styles } from '@/src/styles/tabs';

import { getMajor } from '@/src/api/majors';
import { updateMajorChecklist, dropOrAchieveMajorGoal } from '@/src/api/goals';
import { useMajorGoals } from '@/src/hooks/useMajorGoals';

/** Catalog uses free-text deadlines; goals use TIMESTAMPTZ when set — show both sensibly. */
function formatDeadlineDisplay(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  const raw = String(value).trim();
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime()) && (/^\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes('T'))) {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return raw;
}

function formatMinGpa(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return '—';
  return String(n);
}

export default function MajorGoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Array.isArray(id) ? id[0] : id;

  const qc = useQueryClient();

  const {
    data: goals,
    isLoading: goalsLoading,
    isFetching: goalsFetching,
    isError: goalsError,
  } = useMajorGoals('all');
  const goal = useMemo(() => (goals ?? []).find((g) => g.id === goalId), [goals, goalId]);

  const majorReqId = goal?.major_req_id ?? null;
  const majorQuery = useQuery({
    queryKey: ['major', majorReqId],
    queryFn: () => (majorReqId ? getMajor(majorReqId) : Promise.reject(new Error('no majorReqId'))),
    enabled: !!majorReqId,
    staleTime: 60 * 60 * 1000,
  });

  const checklistMutation = useMutation({
    mutationFn: ({ step_id, completed }: { step_id: string; completed: boolean }) =>
      updateMajorChecklist(goalId, step_id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'all'] });
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'active'] });
    },
  });

  const achieveMutation = useMutation({
    mutationFn: () => dropOrAchieveMajorGoal(goalId, 'achieved'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'all'] });
      qc.invalidateQueries({ queryKey: ['goals', 'major', 'active'] });
    },
  });

  if (!goalId || goalsLoading || goalsFetching || (goal && majorQuery.isLoading)) {
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

  if (!goal) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.placeholder}>Could not find that major goal.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (majorQuery.error || !majorQuery.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.placeholder}>Could not load major requirement details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const major = majorQuery.data as Major;
  const displayDeadline = goal.application_deadline ?? major.application_deadline;
  const displayGpa = major.min_gpa ?? goal.min_gpa;
  const sourceUrl = major.source_url?.trim() ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 56, justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ ...styles.title, fontSize: 32, lineHeight: 34 }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {goal.major_name}
            </Text>
          </View>
          <View style={{ width: 56 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.profileBody}>
        <View style={styles.profileCard}>
          <Text style={styles.rowLabel}>Application deadline</Text>
          <Text style={styles.rowValue}>{formatDeadlineDisplay(displayDeadline)}</Text>

          <Text style={{ ...styles.rowLabel, marginTop: 10 }}>Minimum GPA</Text>
          <Text style={styles.rowValue}>{formatMinGpa(displayGpa)}</Text>

          {sourceUrl ? (
            <>
              <Text style={{ ...styles.rowLabel, marginTop: 10 }}>View on UW website</Text>
              <Text
                style={[
                  styles.rowValue,
                  {
                    marginTop: 4,
                    alignSelf: 'stretch',
                    textAlign: 'center',
                    color: Colors.primaryLight,
                  },
                ]}
                selectable
                accessibilityRole="link"
                onPress={() => Linking.openURL(sourceUrl)}
              >
                {sourceUrl}
              </Text>
            </>
          ) : (
            <View style={{ ...styles.rowStatic, marginTop: 10 }}>
              <Text style={styles.placeholder}>No official program link on file.</Text>
            </View>
          )}
        </View>

        <View style={styles.listCard}>
          <Text style={styles.rowLabel}>Checklist</Text>

          <FlatList
            data={major.checklist_steps}
            keyExtractor={(s) => s.step_id}
            scrollEnabled={false}
            renderItem={({ item: step }) => {
              const completed = !!goal.checklist_progress?.[step.step_id];
              return (
                <Pressable
                  style={styles.checklistRow}
                  onPress={() =>
                    checklistMutation.mutate({ step_id: step.step_id, completed: !completed })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Mark step ${step.label} as ${
                    completed ? 'incomplete' : 'complete'
                  }`}
                >
                  <View style={styles.checklistIcon}>
                    <Ionicons
                      name={completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={completed ? Colors.primary : Colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[styles.checklistText, completed && styles.checklistTextDone]}
                  >
                    {step.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        <Pressable
          style={styles.syncBtn}
          onPress={() => {
            Alert.alert('Mark achieved?', 'This will set the goal status to achieved.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Mark achieved',
                onPress: () => achieveMutation.mutate(),
              },
            ]);
          }}
          disabled={achieveMutation.isPending}
        >
          <Text style={styles.syncBtnText}>
            {achieveMutation.isPending ? 'Updating...' : 'Mark as achieved'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.syncBtn, styles.btnDisabled]}
          onPress={() => {
            Alert.alert('Drop goal?', 'This will drop your active major goal.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Drop',
                style: 'destructive',
                onPress: () => {
                  // Reuse achieve mutation logic but with dropped status
                  dropOrAchieveMajorGoal(goalId, 'dropped')
                    .then(() => {
                      qc.invalidateQueries({ queryKey: ['goals', 'major', 'all'] });
                      qc.invalidateQueries({ queryKey: ['goals', 'major', 'active'] });
                      router.back();
                    })
                    .catch(() => {
                      Alert.alert('Error', 'Could not drop major goal. Try again.');
                    });
                },
              },
            ]);
          }}
        >
          <Text style={styles.syncBtnText}>Drop goal</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
