import React, { useMemo } from 'react';
import { SafeAreaView, Text, View, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTasks } from '@/src/hooks/useTasks';
import type { Task } from '@/src/types/api';

import { tabScreenStyles as styles } from '@/src/styles/tabs';

export default function ProfileCoursesScreen() {
  const {
    data: activeTasks,
    isLoading: activeLoading,
    isError: activeError,
  } = useTasks({ done: false });

  const { data: doneTasks, isLoading: doneLoading } = useTasks({ done: true });

  const courseGroups = useMemo(() => {
    const groups = new Map<string, { courseId: string; active: Task[]; done: Task[] }>();

    for (const t of activeTasks ?? []) {
      const key = t.course_id ?? 'Unassigned';
      const g = groups.get(key) ?? { courseId: key, active: [], done: [] };
      g.active.push(t);
      groups.set(key, g);
    }

    for (const t of doneTasks ?? []) {
      const key = t.course_id ?? 'Unassigned';
      const g = groups.get(key) ?? { courseId: key, active: [], done: [] };
      g.done.push(t);
      groups.set(key, g);
    }

    return [...groups.values()].sort((a, b) => b.active.length - a.active.length);
  }, [activeTasks, doneTasks]);

  if (activeLoading || doneLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C4B8FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (activeError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.placeholder}>Could not load courses.</Text>
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
          <Text style={styles.title}>My Courses</Text>
          <View style={{ width: 48 }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.profileBody}>
        {courseGroups.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.placeholder}>
              No courses yet. Connect your Canvas calendar (ICS) to generate courses, or upload later.
            </Text>
          </View>
        ) : (
          courseGroups.map((g) => {
            const dueCandidates = g.active
              .map((t) => t.due_date)
              .filter(Boolean) as string[];
            const nextDue = dueCandidates.length
              ? new Date(
                  dueCandidates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0],
                ).toLocaleDateString()
              : null;

            return (
              <View key={g.courseId} style={styles.listCard}>
                <View style={styles.rowStatic}>
                  <Text style={styles.rowLabel}>{g.courseId}</Text>
                  <Text style={styles.rowValue}>
                    {g.active.length} active / {g.done.length} done
                  </Text>
                </View>

                <View style={styles.rowStatic}>
                  <Text style={styles.rowLabel}>Next due</Text>
                  <Text style={styles.rowValue}>{nextDue ?? '—'}</Text>
                </View>

                <Pressable
                  style={styles.rowBtn}
                  onPress={() => router.push('/(tabs)/todo')}
                >
                  <Text style={styles.rowLabel}>View in TODO</Text>
                  <Text style={styles.rowValue}>›</Text>
                </Pressable>

                <Pressable
                  style={styles.rowBtn}
                  onPress={() =>
                    Alert.alert(
                      'Syllabus upload not wired yet',
                      'This build currently lists courses based on tasks. We can add the syllabus pipeline next.',
                    )
                  }
                >
                  <Text style={styles.rowLabel}>Upload Syllabus</Text>
                  <Text style={styles.rowValue}>Coming</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
