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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
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
import { useTasks } from '@/src/hooks/useTasks';
import type { ScheduleBlock, BlockType, Task } from '@/src/types/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
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
  date: string;
  startHour: string;
  startMin: string;
  endHour: string;
  endMin: string;
  block_type: BlockType;
  color: string;
}

const BLOCK_TYPES: { label: string; value: BlockType }[] = [
  { label: 'Study', value: 'study' },
  { label: 'Class', value: 'class' },
  { label: 'Commitment', value: 'commitment' },
  { label: 'Other', value: 'other' },
];

function emptyForm(date: string): BlockFormState {
  return {
    title: '',
    date,
    startHour: '09',
    startMin: '00',
    endHour: '10',
    endMin: '00',
    block_type: 'study',
    color: '',
  };
}

function formToTimes(form: BlockFormState): { start_time: string; end_time: string } {
  return {
    start_time: `${form.date}T${form.startHour.padStart(2, '0')}:${form.startMin.padStart(2, '0')}:00`,
    end_time: `${form.date}T${form.endHour.padStart(2, '0')}:${form.endMin.padStart(2, '0')}:00`,
  };
}

function blockToForm(block: ScheduleBlock): BlockFormState {
  const start = new Date(block.start_time);
  const end = new Date(block.end_time);
  return {
    title: block.title,
    date: toDateStr(start),
    startHour: String(start.getHours()).padStart(2, '0'),
    startMin: String(start.getMinutes()).padStart(2, '0'),
    endHour: String(end.getHours()).padStart(2, '0'),
    endMin: String(end.getMinutes()).padStart(2, '0'),
    block_type: block.block_type,
    color: block.color ?? '',
  };
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

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [form, setForm] = useState<BlockFormState>(emptyForm(today));

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
        logEvent('study_block_added', { block_type: form.block_type }).catch(() => {});
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

  const handleHeatToggle = useCallback(() => {
    toggleHeatMap();
    logEvent('heat_map_toggled', { visible: !heatMapVisible }).catch(() => {});
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

      {/* Heat map — fixed above the expandable calendar */}
      <View style={s.heatSection}>
        {heatMapVisible && (
          <View style={s.heatBar}>
            {heatData && heatData.length > 0
              ? heatData.map((entry) => (
                  <TouchableOpacity
                    key={entry.week_start}
                    style={[s.heatSegment, { backgroundColor: entry.color }]}
                    onLongPress={() =>
                      Alert.alert(
                        `Week of ${new Date(entry.week_start).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}`,
                        entry.label.charAt(0).toUpperCase() + entry.label.slice(1),
                      )
                    }
                    onPress={() => {
                      const d = toDateStr(new Date(entry.week_start));
                      setSelectedDate(d);
                      setViewMonth(d.slice(0, 7));
                    }}
                  />
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <View key={i} style={[s.heatSegment, { backgroundColor: Colors.border }]} />
                ))}
          </View>
        )}
        <View style={s.heatToggleRow}>
          <Text style={s.heatLabel}>Workload</Text>
          <Switch
            value={heatMapVisible}
            onValueChange={handleHeatToggle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={heatMapVisible ? Colors.primaryLight : Colors.textMuted}
          />
        </View>
      </View>

      {/* CalendarProvider owns the expandable calendar + scrollable block list */}
      <CalendarProvider
        date={selectedDate}
        onDateChanged={(date) => setSelectedDate(date)}
        onMonthChange={(month) => {
          const m = String(month.month).padStart(2, '0');
          setViewMonth(`${month.year}-${m}`);
        }}
        style={{ flex: 1 }}
      >
        <ExpandableCalendar
          initialPosition={ExpandableCalendar.positions.CLOSED}
          markedDates={markedDates}
          markingType="multi-dot"
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

        {/* Day blocks list scrolls below the expandable calendar */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                      <View style={s.blockContent}>
                        <Text style={s.blockTitle} numberOfLines={1}>
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
      </CalendarProvider>

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

              {/* Date */}
              <View>
                <Text style={s.sheetLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={s.sheetInput}
                  value={form.date}
                  onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                  placeholder="2026-05-07"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* Start time */}
              <View>
                <Text style={s.sheetLabel}>Start time (HH : MM)</Text>
                <View style={s.sheetRow}>
                  <TextInput
                    style={[s.sheetInput, s.sheetInputHalf]}
                    value={form.startHour}
                    onChangeText={(v) => setForm((f) => ({ ...f, startHour: v }))}
                    placeholder="09"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[s.sheetInput, s.sheetInputHalf]}
                    value={form.startMin}
                    onChangeText={(v) => setForm((f) => ({ ...f, startMin: v }))}
                    placeholder="00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>

              {/* End time */}
              <View>
                <Text style={s.sheetLabel}>End time (HH : MM)</Text>
                <View style={s.sheetRow}>
                  <TextInput
                    style={[s.sheetInput, s.sheetInputHalf]}
                    value={form.endHour}
                    onChangeText={(v) => setForm((f) => ({ ...f, endHour: v }))}
                    placeholder="10"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[s.sheetInput, s.sheetInputHalf]}
                    value={form.endMin}
                    onChangeText={(v) => setForm((f) => ({ ...f, endMin: v }))}
                    placeholder="00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
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
});
