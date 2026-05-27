import React, { useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { glanceStyles as styles } from '@/src/styles/chat';
import { useDashboard } from '@/src/hooks/useDashboard';
import { useTasks, useUpdateTask } from '@/src/hooks/useTasks';
import { buildDaySummary, tasksDueToday, tasksDueTodayForList } from '@/src/lib/chatAtAGlance';
import { logEvent } from '@/src/api/sessions';
import type { DashboardScheduleBlock, Task } from '@/src/types/api';

function formatBlockRange(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function blockBarColor(block: DashboardScheduleBlock): string {
  return block.color ?? Colors.primary;
}

interface ChatAtAGlanceProps {
  displayName: string;
}

export function ChatAtAGlance({ displayName }: ChatAtAGlanceProps) {
  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useDashboard();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { mutate: updateTask } = useUpdateTask();

  const todayTasksForList = useMemo(() => tasksDueTodayForList(tasks ?? []), [tasks]);
  const incompleteTodayCount = useMemo(() => tasksDueToday(tasks ?? []).length, [tasks]);

  const summary = useMemo(() => {
    if (!dashboard) return '';
    return buildDaySummary(displayName, dashboard, tasks ?? []);
  }, [dashboard, displayName, tasks]);

  const scheduleBlocks = dashboard?.schedule_today ?? [];
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';

  const handleToggleDone = useCallback(
    (task: Task) => {
      const nextDone = !task.done;
      updateTask({ id: task.id, body: { done: nextDone } });
      if (nextDone) {
        logEvent('task_completed', { task_id: task.id }).catch(() => {});
      }
    },
    [updateTask],
  );

  if (dashLoading || tasksLoading) {
    return (
      <View style={[styles.wrap, { alignItems: 'center', paddingVertical: 40 }]}>
        <ActivityIndicator color={Colors.primaryLight} size="large" />
      </View>
    );
  }

  if (dashError || !dashboard) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.greeting}>Hello, {firstName}!</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            We couldn’t load your day summary right now. Check back in a moment.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.greeting}>Hello, {firstName}!</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      <Text style={styles.sectionTitle}>Due today</Text>
      <View style={styles.sectionCard}>
        {incompleteTodayCount === 0 && todayTasksForList.length === 0 ? (
          <Text style={styles.emptyLine}>Nothing due today — nice!</Text>
        ) : incompleteTodayCount === 0 && todayTasksForList.length > 0 ? (
          <Text style={styles.emptyLine}>All done for today!</Text>
        ) : null}
        {todayTasksForList.map((task, i) => (
          <Pressable
            key={task.id}
            style={[styles.todoRow, i === todayTasksForList.length - 1 && styles.todoRowLast]}
            onPress={() => handleToggleDone(task)}
            accessibilityRole="button"
            accessibilityLabel={`${task.done ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
          >
            <Ionicons
              name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={task.done ? Colors.primary : Colors.textMuted}
            />
            <Text
              style={[styles.todoTitle, task.done && styles.todoTitleDone]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Today’s schedule</Text>
      <View style={styles.sectionCard}>
        {scheduleBlocks.length === 0 ? (
          <Text style={styles.emptyLine}>No events on your calendar today.</Text>
        ) : (
          scheduleBlocks.map((block, i) => (
            <View
              key={block.id}
              style={[
                styles.scheduleRow,
                i === scheduleBlocks.length - 1 && styles.scheduleRowLast,
              ]}
            >
              <View
                style={[styles.scheduleBar, { backgroundColor: blockBarColor(block) }]}
              />
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle} numberOfLines={2}>
                  {block.title}
                </Text>
                <Text style={styles.scheduleTime}>
                  {formatBlockRange(block.start_time, block.end_time)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
