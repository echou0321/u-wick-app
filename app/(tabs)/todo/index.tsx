import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  Switch,
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
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { tabScreenStyles as ts } from '@/src/styles/tabs';
import { todoStyles as s } from '@/src/styles/todo';
import TaskFilterBar, { TaskFilter } from '@/src/components/todo/TaskFilterBar';
import TaskRow from '@/src/components/todo/TaskRow';
import { useTasks, useUpdateTask, useDeleteTask, useCreateTask } from '@/src/hooks/useTasks';
import { connectIcs } from '@/src/api/ics';
import { logEvent } from '@/src/api/sessions';
import { useAuthStore } from '@/src/stores/authStore';
import type { Task } from '@/src/types/api';

type SortOrder = 'due_date' | 'weight';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 0.5, color: '#6AF7C8' },
  { label: 'Medium', value: 1.5, color: '#F7A06A' },
  { label: 'High', value: 3.0, color: '#F76A6A' },
] as const;

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

function applyFilter(tasks: Task[], filter: TaskFilter, forDone = false): Task[] {
  if (filter === 'starred') return tasks.filter((t) => t.highlighted);
  if (filter === 'week') return tasks.filter((t) => isThisWeek(t.due_date));
  if (filter === 'overdue') return tasks.filter(forDone ? isPastDue : isOverdue);
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [undoTask, setUndoTask] = useState<Task | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList<Task>>(null);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter, showCompleted]);

  // ICS import modal state
  const [icsModalVisible, setIcsModalVisible] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [icsUrlError, setIcsUrlError] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Add task form
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createWeight, setCreateWeight] = useState(1.5);
  const [createError, setCreateError] = useState('');

  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: activeTasks, isLoading, isRefetching } = useTasks({ done: false });
  const { data: doneTasks } = useTasks({ done: true });

  // Always refetch the task list when the tab regains focus. Tabs stay
  // mounted in Expo Router, so without this the cache could go stale after
  // an unrelated turn in chat — and we'd rather burn a small GET than
  // surprise the user with missing tasks they just asked the assistant to
  // create.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['tasks'], refetchType: 'active' });
    }, [qc]),
  );
  const { mutate: updateTask, mutateAsync: updateTaskAsync } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();

  const filtered = applyFilter(activeTasks ?? [], filter);
  const sorted = sortTasks(filtered, sortOrder);
  const filteredDone = applyFilter(doneTasks ?? [], filter, true);
  const sortedDone = sortTasks(filteredDone, sortOrder);
  const listData: Task[] = showCompleted ? [...sorted, ...sortedDone] : sorted;

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
    setAddTaskModalVisible(true);
  }

  function handleCreateTask() {
    const trimmed = createTitle.trim();
    if (!trimmed) {
      setCreateError('Please enter a title');
      return;
    }
    let due: string | null = null;
    if (createDueDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(createDueDate.trim())) {
        setCreateError('Use YYYY-MM-DD format (e.g. 2026-05-15)');
        return;
      }
      due = createDueDate.trim();
    }
    setCreateError('');
    createTask(
      { title: trimmed, due_date: due, weight: createWeight },
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

  async function handleConnectIcs() {
    const trimmed = icsUrl.trim();
    if (!trimmed) {
      setIcsUrlError('Please enter your Canvas ICS URL');
      return;
    }
    if (!trimmed.startsWith('https://')) {
      setIcsUrlError('URL must start with https://');
      return;
    }
    setIcsUrlError('');
    setConnecting(true);
    try {
      const result = await connectIcs(trimmed);
      setIcsModalVisible(false);
      setIcsUrl('');
      Alert.alert('Canvas connected!', `${result.tasks_imported} tasks synced from Canvas.`);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      setIcsUrlError('Could not connect. Double-check your URL and try again.');
    } finally {
      setConnecting(false);
    }
  }

  function openIcsModal() {
    setIcsUrl('');
    setIcsUrlError('');
    setIcsModalVisible(true);
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
        const msg = task.source === 'ics'
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
      all: { title: 'No tasks yet', body: 'Connect Canvas to pull in your assignments.' },
      week: { title: 'Nothing due this week', body: 'Enjoy the breather.' },
      overdue: { title: 'No overdue tasks', body: "You're all caught up." },
      starred: { title: 'No starred tasks', body: 'Tap the star on a task to highlight it.' },
    };
    const { title, body } = messages[filter];
    return (
      <View style={s.emptyWrap}>
        <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>{title}</Text>
        <Text style={s.emptyBody}>{body}</Text>
        {filter === 'all' && (
          <TouchableOpacity style={m.connectCta} onPress={openIcsModal} activeOpacity={0.8}>
            <Ionicons name="cloud-download-outline" size={16} color={Colors.white} />
            <Text style={m.connectCtaText}>Connect Canvas</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={ts.safe}>
      {/* Header */}
      <View style={[ts.header, ts.headerRow]}>
        <Text style={ts.title}>TODO</Text>
        <View style={m.headerActions}>
          <TouchableOpacity onPress={handleOpenAddTask} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSortPress} hitSlop={8}>
            <Ionicons name="swap-vertical-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openIcsModal} hitSlop={8}>
            <Ionicons name="cloud-download-outline" size={22} color={Colors.textSecondary} />
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

      {/* Show completed — fixed above the list so it's always reachable */}
      <View style={s.completedRow}>
        <Text style={s.completedRowText}>Show completed</Text>
        <Switch
          value={showCompleted}
          onValueChange={setShowCompleted}
          trackColor={{ true: Colors.primary, false: Colors.border }}
          thumbColor={Colors.white}
        />
      </View>

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

      {/* ICS import modal */}
      <Modal
        visible={icsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIcsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={m.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIcsModalVisible(false)}
          >
            <TouchableOpacity style={m.modalCard} activeOpacity={1}>
              <Text style={m.modalTitle}>Connect Canvas</Text>
              <Text style={m.modalBody}>
                Paste your Canvas ICS URL — find it under Calendar → Calendar Feed in Canvas.
              </Text>
              <TextInput
                style={[m.input, icsUrlError ? m.inputError : undefined]}
                placeholder="https://canvas.uw.edu/feeds/calendars/..."
                placeholderTextColor={Colors.textMuted}
                value={icsUrl}
                onChangeText={(t) => { setIcsUrl(t); setIcsUrlError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {icsUrlError ? <Text style={m.errorText}>{icsUrlError}</Text> : null}
              <TouchableOpacity
                style={[m.connectBtn, connecting && { opacity: 0.6 }]}
                onPress={handleConnectIcs}
                disabled={connecting}
                activeOpacity={0.8}
              >
                {connecting
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={m.connectBtnText}>Connect</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setIcsModalVisible(false)}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

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
              <TextInput
                style={m.input}
                placeholder="2026-05-15"
                placeholderTextColor={Colors.textMuted}
                value={createDueDate}
                onChangeText={(t) => { setCreateDueDate(t); setCreateError(''); }}
                keyboardType="numbers-and-punctuation"
              />

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
                style={[m.connectBtn, isCreating && { opacity: 0.6 }]}
                onPress={handleCreateTask}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                {isCreating
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={m.connectBtnText}>Add task</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setAddTaskModalVisible(false)}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
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
    gap: 16,
    alignItems: 'center',
  },
  connectCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  connectCtaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
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
  },
  modalTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  modalBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: FontSizes.sm * 1.55,
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
  inputError: {
    borderColor: '#F76A6A',
  },
  errorText: {
    color: '#F76A6A',
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginBottom: 8,
  },
  connectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  connectBtnText: {
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
  weightPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weightPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  weightPillTextActive: {
    color: Colors.white,
  },
});
