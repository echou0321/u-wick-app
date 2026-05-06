import { useState, useCallback } from 'react';
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
import { useTasks, useUpdateTask, useDeleteTask } from '@/src/hooks/useTasks';
import { connectIcs } from '@/src/api/ics';
import { useAuthStore } from '@/src/stores/authStore';
import type { Task } from '@/src/types/api';

function isThisWeek(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  return due <= weekFromNow;
}

function applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === 'highlighted') return tasks.filter((t) => t.highlighted);
  if (filter === 'week') return tasks.filter((t) => isThisWeek(t.due_date));
  return tasks;
}

export default function TodoScreen() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  // ICS import modal state
  const [icsModalVisible, setIcsModalVisible] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [icsUrlError, setIcsUrlError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: activeTasks, isLoading, refetch, isRefetching } = useTasks({ done: false });
  const { data: doneTasks } = useTasks({ done: true });
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const filtered = applyFilter(activeTasks ?? [], filter);
  const listData: Task[] = showCompleted
    ? [...filtered, ...(doneTasks ?? [])]
    : filtered;

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

  const handleDelete = useCallback(
    (task: Task) => {
      if (task.source === 'ics') {
        Alert.alert(
          'Remove from list?',
          'Canvas tasks will reappear on the next sync unless removed in Canvas itself.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => updateTask({ id: task.id, body: { done: true } }),
            },
          ],
        );
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
      highlighted: { title: 'No starred tasks', body: 'Tap the star on a task to highlight it.' },
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

      {isLoading ? (
        <View style={ts.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onPress={() => router.push(`/(tabs)/todo/${item.id}`)}
              onToggleStar={() => handleToggleStar(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            <View style={s.completedRow}>
              <Text style={s.completedRowText}>
                {showCompleted ? 'Hide completed' : 'Show completed'}
              </Text>
              <Switch
                value={showCompleted}
                onValueChange={setShowCompleted}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
          }
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={listData.length === 0 ? { flex: 1 } : undefined}
        />
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
});
