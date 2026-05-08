import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { tabScreenStyles as ts } from '@/src/styles/tabs';
import { todoStyles as s } from '@/src/styles/todo';
import TaskFilterBar, { TaskFilter } from '@/src/components/todo/TaskFilterBar';
import TaskRow from '@/src/components/todo/TaskRow';
import { useTasks, useUpdateTask, useDeleteTask, useCreateTask } from '@/src/hooks/useTasks';
import { logEvent } from '@/src/api/sessions';
import { useAuthStore } from '@/src/stores/authStore';
import type { Task } from '@/src/types/api';

type SortOrder = 'due_date' | 'weight';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 0.5, color: '#6AF7C8' },
  { label: 'Medium', value: 1.5, color: '#F7A06A' },
  { label: 'High', value: 3.0, color: '#F76A6A' },
] as const;

const TODAY = new Date().toISOString().split('T')[0];

function formatPickedDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isThisWeek(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  return due >= today && due <= weekFromNow;
}

function isPastDue(task: Task): boolean {
  if (!task.due_date) return false;
  const due = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function isOverdue(task: Task): boolean {
  return !task.done && isPastDue(task);
}

function applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === 'starred') return tasks.filter((t) => t.highlighted);
  if (filter === 'week') return tasks.filter((t) => isThisWeek(t.due_date));
  if (filter === 'overdue') return tasks.filter(isOverdue);
  return tasks;
}

function sortTasks(tasks: Task[], order: SortOrder): Task[] {
  return [...tasks].sort((a, b) => {
    if (order === 'weight') return b.weight - a.weight;
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

export default function TodoScreen() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('due_date');
  const [undoTask, setUndoTask] = useState<Task | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList<Task>>(null);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter]);

  // Add task form
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createWeight, setCreateWeight] = useState(1.5);
  const [createError, setCreateError] = useState('');
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);

  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: activeTasks, isLoading, isRefetching } = useTasks({ done: false });
  const { data: doneTasks } = useTasks({ done: true });
  const { mutate: updateTask, mutateAsync: updateTaskAsync } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();

  const listData: Task[] =
    filter === 'completed'
      ? sortTasks(doneTasks ?? [], sortOrder)
      : sortTasks(applyFilter(activeTasks ?? [], filter), sortOrder);

  const overdueList = applyFilter(activeTasks ?? [], 'overdue');

  function handleUndo() {
    if (!undoTask) return;
    updateTask({ id: undoTask.id, body: { done: false } });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTask(null);
  }

  function handleOpenAddTask() {
    setCreateTitle('');
    setCreateDueDate('');
    setCreateWeight(1.5);
    setCreateError('');
    setDateCalendarOpen(false);
    setAddTaskModalVisible(true);
  }

  function handleCreateTask() {
    const trimmed = createTitle.trim();
    if (!trimmed) {
      setCreateError('Please enter a title');
      return;
    }
    setCreateError('');
    createTask(
      { title: trimmed, due_date: createDueDate || null, weight: createWeight },
      {
        onSuccess: () => setAddTaskModalVisible(false),
        onError: () => setCreateError('Failed to create task. Try again.'),
      },
    );
  }

  function handleSortPress() {
    Alert.alert('Sort tasks', undefined, [
      {
        text: `${sortOrder === 'due_date' ? '✓ ' : ''}By due date`,
        onPress: () => setSortOrder('due_date'),
      },
      {
        text: `${sortOrder === 'weight' ? '✓ ' : ''}By priority (highest first)`,
        onPress: () => setSortOrder('weight'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleMarkAllOverdueDone() {
    if (overdueList.length === 0) return;
    Alert.alert(
      'Mark all overdue as done?',
      `This will mark ${overdueList.length} task${overdueList.length !== 1 ? 's' : ''} as complete.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark all done',
          onPress: async () => {
            await Promise.all(
              overdueList.map((t) => updateTaskAsync({ id: t.id, body: { done: true } })),
            );
            qc.invalidateQueries({ queryKey: ['tasks'] });
          },
        },
      ],
    );
  }

  function handleDevSignOut() {
    Alert.alert('Dev: Sign out', 'Clear auth and return to login?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const handleToggleStar = useCallback(
    (task: Task) => updateTask({ id: task.id, body: { highlighted: !task.highlighted } }),
    [updateTask],
  );

  const handleToggleDone = useCallback(
    (task: Task) => {
      if (!task.done) {
        updateTask({ id: task.id, body: { done: true } });
        logEvent('task_completed', { task_id: task.id }).catch(() => {});
        setUndoTask(task);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setUndoTask(null), 3000);
      } else {
        updateTask({ id: task.id, body: { done: false } });
      }
    },
    [updateTask],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      if (task.source !== 'manual') {
        const msg =
          task.source === 'ics'
            ? 'Canvas tasks will reappear on the next sync unless removed in Canvas itself.'
            : 'Auto-generated tasks can only be removed from your active list, not permanently deleted.';
        Alert.alert('Remove from list?', msg, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => updateTask({ id: task.id, body: { done: true } }),
          },
        ]);
      } else {
        Alert.alert('Delete task?', `"${task.title}" will be permanently deleted.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteTask(task.id),
          },
        ]);
      }
    },
    [updateTask, deleteTask],
  );

  function renderEmpty() {
    if (isLoading) return null;
    const messages: Record<TaskFilter, { title: string; body: string }> = {
      all: { title: 'No tasks yet', body: 'Tap "Add task" to get started, or connect Canvas in Profile.' },
      week: { title: 'Nothing due this week', body: 'Enjoy the breather.' },
      overdue: { title: 'No overdue tasks', body: "You're all caught up." },
      starred: { title: 'No starred tasks', body: 'Tap the star on a task to highlight it.' },
      completed: { title: 'No completed tasks', body: 'Tasks you finish will appear here.' },
    };
    const { title, body } = messages[filter];
    return (
      <View style={s.emptyWrap}>
        <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>{title}</Text>
        <Text style={s.emptyBody}>{body}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={ts.safe}>
      {/* Header */}
      <View style={[ts.header, ts.headerRow]}>
        <Text style={ts.title}>TODO</Text>
        <View style={m.headerActions}>
          <TouchableOpacity onPress={handleSortPress} hitSlop={8}>
            <Ionicons name="swap-vertical-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenAddTask} style={m.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={m.addBtnText}>Add task</Text>
          </TouchableOpacity>
          {/* Dev-only sign out — remove before production */}
          {__DEV__ && (
            <TouchableOpacity onPress={handleDevSignOut} hitSlop={8}>
              <Ionicons name="log-out-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TaskFilterBar active={filter} onChange={setFilter} />

      {/* Mark all overdue done — only shown on Overdue tab */}
      {filter === 'overdue' && overdueList.length > 0 && (
        <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllOverdueDone} activeOpacity={0.8}>
          <Ionicons name="checkmark-done-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.markAllBtnText}>Mark all {overdueList.length} as done</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={ts.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onPress={() => router.push(`/(tabs)/todo/${item.id}`)}
              onToggleStar={() => handleToggleStar(item)}
              onToggleDone={() => handleToggleDone(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['tasks'] })}
          refreshing={isRefetching}
          contentContainerStyle={listData.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
        />
      )}

      {/* Undo toast */}
      {undoTask && (
        <View style={s.undoToast}>
          <Text style={s.undoToastText}>Marked as done</Text>
          <TouchableOpacity style={s.undoBtn} onPress={handleUndo}>
            <Text style={s.undoBtnText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add task modal */}
      <Modal
        visible={addTaskModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddTaskModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={m.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAddTaskModalVisible(false)}
          >
            <TouchableOpacity style={m.modalCard} activeOpacity={1}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={m.modalTitle}>Add task</Text>

                <Text style={m.formLabel}>Title</Text>
                <TextInput
                  style={m.input}
                  placeholder="e.g. Play Stardew Valley, read chapter 4…"
                  placeholderTextColor={Colors.textMuted}
                  value={createTitle}
                  onChangeText={(t) => { setCreateTitle(t); setCreateError(''); }}
                />

                <Text style={m.formLabel}>Due date (optional)</Text>
                <TouchableOpacity
                  style={m.dateField}
                  onPress={() => setDateCalendarOpen((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={createDueDate ? m.dateFieldText : m.dateFieldPlaceholder}>
                    {createDueDate ? formatPickedDate(createDueDate) : 'Select a date'}
                  </Text>
                  <Ionicons
                    name={dateCalendarOpen ? 'chevron-up' : 'calendar-outline'}
                    size={16}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {dateCalendarOpen && (
                  <View style={m.inlineCalendar}>
                    <Calendar
                      onDayPress={(day) => {
                        setCreateDueDate(day.dateString);
                        setDateCalendarOpen(false);
                      }}
                      markedDates={
                        createDueDate
                          ? { [createDueDate]: { selected: true, selectedColor: Colors.primary } }
                          : {}
                      }
                      minDate={TODAY}
                      theme={{
                        backgroundColor: Colors.surface,
                        calendarBackground: Colors.surface,
                        textSectionTitleColor: Colors.textMuted,
                        selectedDayBackgroundColor: Colors.primary,
                        selectedDayTextColor: Colors.white,
                        todayTextColor: Colors.primaryLight,
                        dayTextColor: Colors.textPrimary,
                        textDisabledColor: Colors.textMuted,
                        arrowColor: Colors.primary,
                        monthTextColor: Colors.textPrimary,
                        textDayFontFamily: Fonts.body,
                        textMonthFontFamily: Fonts.heading,
                        textDayHeaderFontFamily: Fonts.bodyMedium,
                      }}
                    />
                    {createDueDate ? (
                      <TouchableOpacity
                        style={m.calendarClearBtn}
                        onPress={() => { setCreateDueDate(''); setDateCalendarOpen(false); }}
                      >
                        <Text style={m.calendarClearText}>Clear date</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                <Text style={m.formLabel}>Priority</Text>
                <View style={m.weightRow}>
                  {PRIORITY_OPTIONS.map((opt) => {
                    const active = createWeight === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        style={[
                          m.weightPill,
                          active && { backgroundColor: opt.color + '28', borderColor: opt.color },
                        ]}
                        onPress={() => setCreateWeight(opt.value)}
                        activeOpacity={0.8}
                      >
                        <Text style={[m.weightPillText, active && { color: opt.color }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {createError ? <Text style={m.errorText}>{createError}</Text> : null}

                <TouchableOpacity
                  style={[m.primaryBtn, isCreating && { opacity: 0.6 }]}
                  onPress={handleCreateTask}
                  disabled={isCreating}
                  activeOpacity={0.8}
                >
                  {isCreating
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={m.primaryBtnText}>Add task</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={m.cancelBtn} onPress={() => setAddTaskModalVisible(false)}>
                  <Text style={m.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const m = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surfaceRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 24,
    paddingBottom: 44,
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    marginBottom: 4,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  dateFieldText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  dateFieldPlaceholder: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  errorText: {
    color: '#F76A6A',
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  formLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
  },
  weightRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 4,
  },
  weightPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weightPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  inlineCalendar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  calendarClearBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  calendarClearText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: '#F76A6A',
  },
});
