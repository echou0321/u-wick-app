import React, { useMemo } from 'react';
import { Text, View, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTasks } from '@/src/hooks/useTasks';
import { useCourses } from '@/src/hooks/useCourses';
import type { Task, Course } from '@/src/types/api';

import { tabScreenStyles as styles } from '@/src/styles/tabs';

export default function ProfileCoursesScreen() {
  const {
    data: activeTasks,
    isLoading: activeLoading,
    isError: activeError,
  } = useTasks({ done: false });

  const { data: doneTasks, isLoading: doneLoading } = useTasks({ done: true });
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  const courseById = useMemo(
    () => new Map<string, Course>(courses.map((c) => [c.id, c])),
    [courses],
  );

  const courseGroups = useMemo(() => {
    const groups = new Map<string, { courseId: string; active: Task[]; done: Task[] }>();

    for (const t of activeTasks ?? []) {
      const key = t.course_id ?? 'unassigned';
      const g = groups.get(key) ?? { courseId: key, active: [], done: [] };
      g.active.push(t);
      groups.set(key, g);
    }

    for (const t of doneTasks ?? []) {
      const key = t.course_id ?? 'unassigned';
      const g = groups.get(key) ?? { courseId: key, active: [], done: [] };
      g.done.push(t);
      groups.set(key, g);
    }

    // Add courses from the API that have no tasks yet so they appear for syllabus upload
    for (const c of courses) {
      if (!groups.has(c.id)) {
        groups.set(c.id, { courseId: c.id, active: [], done: [] });
      }
    }

    return [...groups.values()].sort((a, b) => b.active.length - a.active.length);
  }, [activeTasks, doneTasks, courses]);

  if (activeLoading || doneLoading || coursesLoading) {
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
            const course = courseById.get(g.courseId);
            const displayName =
              course?.name ?? (g.courseId === 'unassigned' ? 'Unassigned' : g.courseId);

            const dueCandidates = g.active
              .map((t) => t.due_date)
              .filter(Boolean) as string[];
            const nextDue = dueCandidates.length
              ? new Date(
                  dueCandidates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0],
                ).toLocaleDateString()
              : null;

            const syllabusParam =
              g.courseId === 'unassigned' ? 'Unassigned' : g.courseId;

            return (
              <View key={g.courseId} style={styles.listCard}>
                <View style={styles.rowStatic}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {course?.color ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: course.color,
                        }}
                      />
                    ) : null}
                    <Text style={[styles.rowLabel, { flex: 1 }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </View>
                  <Text style={styles.rowValue}>
                    {g.active.length} active / {g.done.length} done
                  </Text>
                </View>

                {course?.quarter ? (
                  <View style={styles.rowStatic}>
                    <Text style={styles.rowLabel}>Quarter</Text>
                    <Text style={styles.rowValue}>{course.quarter}</Text>
                  </View>
                ) : null}

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
                    router.push(
                      `/(tabs)/profile/syllabus-upload?courseId=${encodeURIComponent(syllabusParam)}&courseName=${encodeURIComponent(displayName)}`,
                    )
                  }
                >
                  <Text style={styles.rowLabel}>Upload Syllabus</Text>
                  <Text style={styles.rowValue}>›</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
