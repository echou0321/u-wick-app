import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { tabScreenStyles as ts } from '@/src/styles/tabs';
import { scheduleStyles as s } from '@/src/styles/schedule';
import { useUIStore } from '@/src/stores/uiStore';
import { useHeat } from '@/src/hooks/useHeat';
import {
  useScheduleBlocks,
  useCreateScheduleBlock,
  useUpdateScheduleBlock,
  useDeleteScheduleBlock,
} from '@/src/hooks/useSchedule';
import { logEvent } from '@/src/api/sessions';
import { useTasks, useUpdateTask } from '@/src/hooks/useTasks';
import type { ScheduleBlock, BlockType, Task } from '@/src/types/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  // Use local calendar components — NOT toISOString() — so a block at
  // "May 22, 10 PM Pacific" doesn't get attributed to May 23 in UTC.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function quarterStart(): string {
  // Heat map: 8 weeks ending this week. Anchor to Monday so the backend's
  // week-grouped aggregation lines up cleanly.
  const d = new Date();
  const dow = d.getDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday - 49); // start of this week, then 7 weeks back
  d.setHours(0, 0, 0, 0);
  return toDateStr(d);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function blockColor(block: ScheduleBlock): string {
  if (block.color) return block.color;
  switch (block.block_type) {
    case 'class': return Colors.primary;
    case 'study': return Colors.accentTeal;
    case 'commitment': return Colors.accentOrange;
    default: return Colors.textSecondary;
  }
}

function blockTypeColors(type: BlockType): { bg: string; text: string; border: string } {
  switch (type) {
    case 'class': return { bg: '#1A1340', text: Colors.primaryLight, border: '#3D2FA0' };
    case 'study': return { bg: '#0D2A22', text: Colors.accentTeal, border: '#1A5040' };
    case 'commitment': return { bg: '#2A1A08', text: Colors.accentOrange, border: '#5A3010' };
    default: return { bg: Colors.surface, text: Colors.textSecondary, border: Colors.border };
  }
}

// ── Form types ────────────────────────────────────────────────────────────────

interface BlockFormState {
  title: string;
  // `date` holds the day; only year/month/day are read.
  // `startTime` / `endTime` hold the times of day; only hours/minutes are read.
  date: Date;
  startTime: Date;
  endTime: Date;
  block_type: BlockType;
  color: string;
}

const BLOCK_TYPES: { label: string; value: BlockType }[] = [
  { label: 'Study', value: 'study' },
  { label: 'Class', value: 'class' },
  { label: 'Commitment', value: 'commitment' },
  { label: 'Other', value: 'other' },
];

function atHour(h: number, m: number): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function emptyForm(dateStr: string): BlockFormState {
  const [y, m, day] = dateStr.split('-').map(Number);
  return {
    title: '',
    date: new Date(y, (m ?? 1) - 1, day ?? 1),
    startTime: atHour(9, 0),
    endTime: atHour(10, 0),
    block_type: 'study',
    color: '',
  };
}

function combine(date: Date, time: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

function formToTimes(form: BlockFormState): { start_time: string; end_time: string } {
  return {
    start_time: combine(form.date, form.startTime),
    end_time: combine(form.date, form.endTime),
  };
}

function blockToForm(block: ScheduleBlock): BlockFormState {
  const start = new Date(block.start_time);
  const end = new Date(block.end_time);
  return {
    title: block.title,
    date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
    startTime: start,
    endTime: end,
    block_type: block.block_type,
    color: block.color ?? '',
  };
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const { heatMapVisible, toggleHeatMap, offlineMode } = useUIStore();

  const today = useMemo(() => toDateStr(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(today.slice(0, 7));

  const rangeStart = `${viewMonth}-01`;
  const rangeEnd = useMemo(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    const last = new Date(y, m, 0);
    return toDateStr(last);
  }, [viewMonth]);

  const heatStart = useMemo(() => quarterStart(), []);
  const { data: heatData } = useHeat(heatStart, 8);
  const { data: blocks, isLoading: blocksLoading } = useScheduleBlocks(rangeStart, rangeEnd);
  // Surface all open tasks on the calendar (ICS due dates, syllabus deadlines, etc.)
  const { data: openTasks } = useTasks({ done: false });
  const createBlock = useCreateScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();
  const updateTask = useUpdateTask();
  const qc = useQueryClient();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [form, setForm] = useState<BlockFormState>(emptyForm(today));
  // Which of the three pickers (date / start time / end time) is open.
  // Android renders the picker as a native modal that auto-closes; iOS
  // renders inline below the row.
  const [activePicker, setActivePicker] = useState<
    'date' | 'startTime' | 'endTime' | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);

  const dayBlocks = useMemo(() => {
    if (!blocks) return [];
    return blocks
      .filter((b) => toDateStr(new Date(b.start_time)) === selectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [blocks, selectedDate]);

  // Tasks (incl. ICS-imported assignments) that are due on the selected day
  const dayTasks = useMemo<Task[]>(() => {
    if (!openTasks) return [];
    return openTasks
      .filter((t) => t.due_date && toDateStr(new Date(t.due_date)) === selectedDate)
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''));
  }, [openTasks, selectedDate]);

  const markedDates = useMemo(() => {
    type Dot = { key: string; color: string };
    const marks: Record<
      string,
      { dots?: Dot[]; selected?: boolean; selectedColor?: string }
    > = {};
    const addDot = (date: string, dot: Dot) => {
      const cur = marks[date] ?? {};
      const dots = cur.dots ?? [];
      // dedupe by key
      if (!dots.some((d) => d.key === dot.key)) dots.push(dot);
      marks[date] = { ...cur, dots };
    };
    if (blocks) {
      blocks.forEach((b) => {
        addDot(toDateStr(new Date(b.start_time)), {
          key: `block-${b.block_type}`,
          color: blockColor(b),
        });
      });
    }
    if (openTasks) {
      openTasks.forEach((t) => {
        if (!t.due_date) return;
        addDot(toDateStr(new Date(t.due_date)), {
          key: `task-${t.source}`,
          color: t.source === 'ics' ? Colors.primaryLight : Colors.accentOrange,
        });
      });
    }
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: Colors.primary,
    };
    return marks;
  }, [blocks, openTasks, selectedDate]);

  const openCreate = useCallback(() => {
    setEditingBlock(null);
    setForm(emptyForm(selectedDate));
    setSheetVisible(true);
  }, [selectedDate]);

  const openEdit = useCallback((block: ScheduleBlock) => {
    setEditingBlock(block);
    setForm(blockToForm(block));
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setEditingBlock(null);
    setActivePicker(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this block.');
      return;
    }
    const { start_time, end_time } = formToTimes(form);
    if (new Date(end_time) <= new Date(start_time)) {
      Alert.alert('Invalid times', 'End time must be after start time.');
      return;
    }
    try {
      if (editingBlock) {
        await updateBlock.mutateAsync({
          id: editingBlock.id,
          body: { title: form.title.trim(), start_time, end_time, color: form.color || null },
        });
      } else {
        await createBlock.mutateAsync({
          title: form.title.trim(),
          start_time,
          end_time,
          block_type: form.block_type,
          color: form.color || null,
        });
        logEvent('study_block_added', { block_type: form.block_type });
      }
      closeSheet();
    } catch {
      Alert.alert('Error', 'Failed to save block. Please try again.');
    }
  }, [form, editingBlock, createBlock, updateBlock, closeSheet]);

  const handleDelete = useCallback(() => {
    if (!editingBlock) return;
    Alert.alert('Delete block', 'Remove this block from your schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBlock.mutateAsync(editingBlock.id);
            closeSheet();
          } catch {
            Alert.alert('Error', 'Failed to delete block.');
          }
        },
      },
    ]);
  }, [editingBlock, deleteBlock, closeSheet]);

  // Refresh schedule + heat + tasks whenever the tab regains focus, so
  // chat-driven changes appear without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['schedule'], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['heat'], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['tasks'], refetchType: 'active' });
    }, [qc]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['schedule'] }),
        qc.invalidateQueries({ queryKey: ['heat'] }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [qc]);

  const handleToggleTaskDone = useCallback(
    (task: Task) => {
      const apply = () => {
        updateTask.mutate({ id: task.id, body: { done: !task.done } });
        if (!task.done) logEvent('task_completed', { source: task.source });
      };
      // Canvas / syllabus / AI tasks: backend will re-import on next sync.
      // Warn the user once before flipping, matching the TODO tab pattern.
      if (!task.done && task.source !== 'manual') {
        const label =
          task.source === 'ics' ? 'Canvas' : task.source === 'syllabus' ? 'syllabus' : 'AI';
        Alert.alert(
          'Mark complete?',
          `This ${label}-imported task will reappear on the next sync unless removed at the source.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Mark done', onPress: apply },
          ],
        );
      } else {
        apply();
      }
    },
    [updateTask],
  );

  const handleHeatToggle = useCallback(() => {
    toggleHeatMap();
    logEvent('heat_map_toggled', { visible: !heatMapVisible });
  }, [toggleHeatMap, heatMapVisible]);

  const isMutating = createBlock.isPending || updateBlock.isPending;

  return (
    <SafeAreaView style={ts.safe}>
      {/* Offline banner */}
      {offlineMode && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={15} color="#F7D06A" />
          <Text style={s.offlineBannerText}>You're offline — edits are unavailable</Text>
        </View>
      )}

      {/* Header */}
      <View style={ts.header}>
        <View style={ts.headerRow}>
          <Text style={ts.title}>Schedule</Text>
          <TouchableOpacity
            onPress={offlineMode ? undefined : openCreate}
            style={[localStyles.addBtn, offlineMode && { opacity: 0.4 }]}
            disabled={offlineMode}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={localStyles.addBtnText}>Add block</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Heat map — fixed above the calendar */}
      <View style={s.heatSection}>
        {heatMapVisible && (
          <View style={s.heatBar}>
            {heatData && heatData.length > 0
              ? heatData.map((entry) => (
                  <TouchableOpacity
                    key={entry.week_start}
                    style={[s.heatSegment, { backgroundColor: entry.color }]}
                    // Tap or long-press shows the week + workload label
                    // without changing the calendar — earlier behavior of
                    // navigating the calendar to that week was confusing.
                    onPress={() =>
                      Alert.alert(
                        `Week of ${new Date(entry.week_start).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}`,
                        `Workload: ${entry.label.charAt(0).toUpperCase() + entry.label.slice(1)}`,
                      )
                    }
                  />
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <View key={i} style={[s.heatSegment, { backgroundColor: Colors.border }]} />
                ))}
          </View>
        )}
        <View style={s.heatToggleRow}>
          <View style={localStyles.heatLabelRow}>
            <Text style={s.heatLabel}>Workload</Text>
            <TouchableOpacity
              hitSlop={10}
              onPress={() =>
                Alert.alert(
                  'Workload heat map',
                  'A 7-day snapshot of how busy your upcoming weeks look. Each segment is one week (left = this week, right = 7 weeks out), colored by how many assignments and study blocks you have due:\n\n🟢 Light\n🟡 Moderate\n🟠 Heavy\n🔴 Intense\n\nTap any segment to see its date and workload level.',
                )
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          <Switch
            value={heatMapVisible}
            onValueChange={handleHeatToggle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={heatMapVisible ? Colors.primaryLight : Colors.textMuted}
          />
        </View>
      </View>

      {/* Standard month-view Calendar — ExpandableCalendar conflicts with
          react-native-reanimated v4 (collapses to zero height), so we use
          the simpler Calendar component until that's resolved upstream. */}
      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        onMonthChange={(month: { year: number; month: number }) => {
          const m = String(month.month).padStart(2, '0');
          setViewMonth(`${month.year}-${m}`);
        }}
        markedDates={markedDates}
        markingType="multi-dot"
        enableSwipeMonths
        theme={{
          backgroundColor: Colors.bg,
          calendarBackground: Colors.bg,
          textSectionTitleColor: Colors.textMuted,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.white,
          todayTextColor: Colors.primaryLight,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.textMuted,
          dotColor: Colors.accentTeal,
          selectedDotColor: Colors.white,
          arrowColor: Colors.primary,
          monthTextColor: Colors.textPrimary,
          indicatorColor: Colors.primary,
          textDayFontFamily: Fonts.body,
          textMonthFontFamily: Fonts.heading,
          textDayHeaderFontFamily: Fonts.bodyMedium,
          textDayFontSize: FontSizes.sm,
          textMonthFontSize: FontSizes.base,
          textDayHeaderFontSize: FontSizes.xs,
        }}
      />

      {/* Day blocks list scrolls below the calendar */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
          <View style={s.blocksSection}>
            <Text style={s.blocksSectionTitle}>
              {selectedDate === today
                ? "Today's blocks"
                : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
            </Text>

            {blocksLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 30 }} />
            ) : dayBlocks.length === 0 && dayTasks.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
                <Text style={s.emptyTitle}>Nothing scheduled</Text>
                <Text style={s.emptyBody}>
                  Tap "Add block" to schedule study or class time. Canvas
                  assignments will appear on their due date.
                </Text>
              </View>
            ) : (
              <>
                {dayBlocks.map((block) => {
                  const colors = blockTypeColors(block.block_type);
                  const isEditable = block.block_type !== 'class' && !offlineMode;
                  return (
                    <TouchableOpacity
                      key={block.id}
                      style={s.blockCard}
                      onPress={isEditable ? () => openEdit(block) : undefined}
                      activeOpacity={isEditable ? 0.7 : 1}
                    >
                      <View
                        style={[s.blockColorBar, { backgroundColor: blockColor(block) }]}
                      />
                      <View style={s.blockContent}>
                        <Text style={s.blockTitle} numberOfLines={1}>
                          {block.title}
                        </Text>
                        <Text style={s.blockTime}>
                          {formatTimeRange(block.start_time, block.end_time)}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.blockTypeBadge,
                          { backgroundColor: colors.bg, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[s.blockTypeBadgeText, { color: colors.text }]}>
                          {block.block_type}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {dayTasks.length > 0 && (
                  <Text style={[s.blocksSectionTitle, { marginTop: 8 }]}>
                    Due {selectedDate === today ? 'today' : 'this day'}
                  </Text>
                )}
                {dayTasks.map((task) => {
                  const accent =
                    task.source === 'ics' ? Colors.primaryLight : Colors.accentOrange;
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={s.blockCard}
                      onPress={() => router.push(`/(tabs)/todo/${task.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.blockColorBar, { backgroundColor: accent }]} />
                      {/* Tap-to-complete checkbox — stops propagation so the
                          row doesn't also navigate. Mirrors the TODO tab UX. */}
                      <TouchableOpacity
                        onPress={() => handleToggleTaskDone(task)}
                        hitSlop={8}
                        style={localStyles.taskCheckBtn}
                      >
                        <Ionicons
                          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={task.done ? Colors.accentTeal : Colors.textMuted}
                        />
                      </TouchableOpacity>
                      <View style={s.blockContent}>
                        <Text
                          style={[
                            s.blockTitle,
                            task.done && localStyles.taskTitleDone,
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        <Text style={s.blockTime}>
                          Due {formatTime(task.due_date as string)} · {task.source}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.blockTypeBadge,
                          {
                            backgroundColor: Colors.surface,
                            borderColor: Colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.blockTypeBadgeText,
                            { color: Colors.textSecondary },
                          ]}
                        >
                          task
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
      </ScrollView>

      {/* Create / Edit modal */}
      <Modal
        visible={sheetVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>
            {editingBlock ? 'Edit block' : 'Add block'}
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={s.sheetBody}>
              {/* Title */}
              <View>
                <Text style={s.sheetLabel}>Title</Text>
                <TextInput
                  style={s.sheetInput}
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="e.g. Study: INFO 201"
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="next"
                />
              </View>

              {/* Date — native picker */}
              <View>
                <Text style={s.sheetLabel}>Date</Text>
                <TouchableOpacity
                  style={[s.sheetInput, localStyles.pickerRow]}
                  onPress={() =>
                    setActivePicker((p) => (p === 'date' ? null : 'date'))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={localStyles.pickerValue}>
                    {formatDateLong(form.date)}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {activePicker === 'date' && (
                  <DateTimePicker
                    value={form.date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="dark"
                    accentColor={Colors.primary}
                    onChange={(_, picked) => {
                      if (Platform.OS !== 'ios') setActivePicker(null);
                      if (picked) setForm((f) => ({ ...f, date: picked }));
                    }}
                  />
                )}
              </View>

              {/* Start time */}
              <View>
                <Text style={s.sheetLabel}>Start time</Text>
                <TouchableOpacity
                  style={[s.sheetInput, localStyles.pickerRow]}
                  onPress={() =>
                    setActivePicker((p) => (p === 'startTime' ? null : 'startTime'))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={localStyles.pickerValue}>
                    {formatTimeShort(form.startTime)}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {activePicker === 'startTime' && (
                  <DateTimePicker
                    value={form.startTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="dark"
                    accentColor={Colors.primary}
                    minuteInterval={5}
                    onChange={(_, picked) => {
                      if (Platform.OS !== 'ios') setActivePicker(null);
                      if (picked)
                        setForm((f) => {
                          // Auto-shift end so it stays at least 30 min after
                          // the new start, but only when end is now <= start.
                          const next = { ...f, startTime: picked };
                          if (picked.getTime() >= f.endTime.getTime()) {
                            const e = new Date(picked);
                            e.setMinutes(e.getMinutes() + 60);
                            next.endTime = e;
                          }
                          return next;
                        });
                    }}
                  />
                )}
              </View>

              {/* End time */}
              <View>
                <Text style={s.sheetLabel}>End time</Text>
                <TouchableOpacity
                  style={[s.sheetInput, localStyles.pickerRow]}
                  onPress={() =>
                    setActivePicker((p) => (p === 'endTime' ? null : 'endTime'))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={localStyles.pickerValue}>
                    {formatTimeShort(form.endTime)}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {activePicker === 'endTime' && (
                  <DateTimePicker
                    value={form.endTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="dark"
                    accentColor={Colors.primary}
                    minuteInterval={5}
                    onChange={(_, picked) => {
                      if (Platform.OS !== 'ios') setActivePicker(null);
                      if (picked) setForm((f) => ({ ...f, endTime: picked }));
                    }}
                  />
                )}
              </View>

              {/* Block type (create only) */}
              {!editingBlock && (
                <View>
                  <Text style={s.sheetLabel}>Type</Text>
                  <View style={s.typeRow}>
                    {BLOCK_TYPES.map(({ label, value }) => (
                      <TouchableOpacity
                        key={value}
                        style={[s.typePill, form.block_type === value && s.typePillActive]}
                        onPress={() => setForm((f) => ({ ...f, block_type: value }))}
                      >
                        <Text
                          style={[
                            s.typePillText,
                            form.block_type === value && s.typePillTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Color */}
              <View>
                <Text style={s.sheetLabel}>Color (optional hex)</Text>
                <TextInput
                  style={s.sheetInput}
                  value={form.color}
                  onChangeText={(v) => setForm((f) => ({ ...f, color: v }))}
                  placeholder="#7C6AF7"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[s.sheetSaveBtn, isMutating && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isMutating}
              >
                {isMutating ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={s.sheetSaveBtnText}>
                    {editingBlock ? 'Save changes' : 'Add block'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Delete button (edit only) */}
              {editingBlock && (
                <TouchableOpacity
                  style={[s.sheetDeleteBtn, deleteBlock.isPending && { opacity: 0.6 }]}
                  onPress={handleDelete}
                  disabled={deleteBlock.isPending}
                >
                  <Text style={s.sheetDeleteBtnText}>Delete block</Text>
                </TouchableOpacity>
              )}

              {/* Cancel */}
              <TouchableOpacity onPress={closeSheet} style={localStyles.cancelBtn}>
                <Text style={localStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
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
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 32,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  // ── Heat map label + info icon row ───────────────────────────────────
  heatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // ── Picker rows (date / time) in the add/edit block modal ────────────
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  // ── Task row (Due today list) ────────────────────────────────────────
  taskCheckBtn: {
    paddingHorizontal: 2,
    marginRight: 8,
    flexShrink: 0,
  },
  taskTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through' as const,
  },
});
