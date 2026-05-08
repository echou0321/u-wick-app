import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { tabScreenStyles as ts } from '@/src/styles/tabs';
import { todoStyles as s } from '@/src/styles/todo';
import { useTask, useUpdateTask, useDeleteTask, useTasks, useSubtasks, useBreakdownTask } from '@/src/hooks/useTasks';
import { logEvent } from '@/src/api/sessions';
import SubtaskRow from '@/src/components/todo/SubtaskRow';
import type { TaskSource } from '@/src/types/api';

const SOURCE_LABELS: Record<TaskSource, string> = {
  ics: 'Canvas',
  syllabus: 'Syllabus',
  ai: 'AI',
  manual: 'Manual',
};

const SOURCE_COLORS: Record<TaskSource, { bg: string; border: string; text: string }> = {
  ics: { bg: Colors.accentTeal + '22', border: Colors.accentTeal + '55', text: Colors.accentTeal },
  syllabus: { bg: Colors.accentYellow + '22', border: Colors.accentYellow + '55', text: Colors.accentYellow },
  ai: { bg: Colors.primary + '22', border: Colors.primary + '55', text: Colors.primaryLight },
  manual: { bg: Colors.border, border: Colors.borderSubtle, text: Colors.textSecondary },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function priorityLabel(weight: number): string {
  if (weight >= 2.0) return 'High';
  if (weight >= 1.0) return 'Medium';
  if (weight > 0)   return 'Low';
  return 'None';
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Warm both caches so useTask can find the task without a dedicated GET /tasks/:id
  useTasks({ done: false });
  useTasks({ done: true });

  const task = useTask(id);
  const { data: subtasks = [] } = useSubtasks(id);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: breakdown, isPending: isBreakingDown } = useBreakdownTask();

  if (!task) {
    return (
      <SafeAreaView style={ts.safe}>
        <View style={ts.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const sourceStyle = SOURCE_COLORS[task.source];

  function handleToggleDone() {
    if (!task!.done) logEvent('task_completed', { task_id: task!.id }).catch(() => {});
    updateTask({ id: task!.id, body: { done: !task!.done } });
  }

  function handleDelete() {
    const isManual = task!.source === 'manual';
    const isIcs = task!.source === 'ics';
    const title = isManual ? 'Delete task?' : 'Remove from list?';
    const message = isManual
      ? `"${task!.title}" will be permanently deleted.`
      : isIcs
        ? 'Canvas tasks will reappear on the next sync unless removed in Canvas itself.'
        : 'Auto-generated tasks can only be removed from your active list, not permanently deleted.';
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isManual ? 'Delete' : 'Remove',
        style: 'destructive',
        onPress: () => {
          if (isManual) {
            deleteTask(task!.id, { onSuccess: () => router.back() });
          } else {
            updateTask(
              { id: task!.id, body: { done: true } },
              { onSuccess: () => router.back() },
            );
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={ts.safe}>
      {/* Header */}
      <View style={[ts.header, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.md, color: Colors.textPrimary, flex: 1 }}
          numberOfLines={2}
        >
          {task.title}
        </Text>
      </View>

      <ScrollView style={s.detailScroll} contentContainerStyle={s.detailBody}>
        {/* Main info card */}
        <View style={s.detailCard}>
          <View style={s.doneToggleRow}>
            <Text style={s.doneToggleLabel}>Mark as done</Text>
            <Switch
              value={task.done}
              onValueChange={handleToggleDone}
              disabled={isUpdating}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Due date</Text>
            <Text style={s.detailValue}>{formatDate(task.due_date)}</Text>
          </View>

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Priority</Text>
            <Text style={s.detailValue}>{priorityLabel(task.weight)}</Text>
          </View>

          {task.tag ? (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Tag</Text>
              <Text style={s.detailValue}>{task.tag}</Text>
            </View>
          ) : null}

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Source</Text>
            <View
              style={[
                s.sourceBadge,
                { backgroundColor: sourceStyle.bg, borderColor: sourceStyle.border },
              ]}
            >
              <Text style={[s.sourceBadgeText, { color: sourceStyle.text }]}>
                {SOURCE_LABELS[task.source]}
              </Text>
            </View>
          </View>
        </View>

        {/* Subtask section — shown once breakdown has been run */}
        {subtasks.length > 0 && (
          <View style={s.subtaskSection}>
            <Text style={s.subtaskSectionTitle}>Subtasks</Text>
            {subtasks.map((st) => (
              <SubtaskRow key={st.id} subtask={st} />
            ))}
          </View>
        )}

        {/* Breakdown button */}
        <TouchableOpacity
          style={[s.breakdownBtn, isBreakingDown && { opacity: 0.6 }]}
          onPress={() => {
            logEvent('task_breakdown_requested', { task_id: task.id }).catch(() => {});
            breakdown(task.id);
          }}
          disabled={isBreakingDown || isDeleting || isUpdating}
          activeOpacity={0.8}
        >
          {isBreakingDown ? (
            <ActivityIndicator size="small" color={Colors.textSecondary} />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={18} color={Colors.textSecondary} />
              <Text style={s.breakdownBtnText}>Break this down</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete / remove */}
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={handleDelete}
          disabled={isDeleting || isUpdating}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color="#F76A6A" />
          <Text style={s.deleteBtnText}>
            {task.source === 'manual' ? 'Delete task' : 'Remove from list'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
