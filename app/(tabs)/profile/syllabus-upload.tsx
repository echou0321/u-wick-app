import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/src/hooks/useUser';
import { useCourses } from '@/src/hooks/useCourses';
import { extractSyllabus, confirmSyllabus, type ExtractedTask } from '@/src/api/syllabus';
import type { Course } from '@/src/types/api';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { tabScreenStyles as ts } from '@/src/styles/tabs';

function priorityInfo(weight: number): { label: string; color: string } {
  if (weight >= 2.0) return { label: 'High', color: '#F76A6A' };
  if (weight >= 1.0) return { label: 'Medium', color: '#F7A06A' };
  return { label: 'Low', color: '#6AF7C8' };
}

export default function SyllabusUploadScreen() {
  const { courseId, courseName } = useLocalSearchParams<{ courseId: string; courseName?: string }>();
  const { data: user } = useUser();
  const { data: courses = [] } = useCourses();
  const qc = useQueryClient();

  const paramCourseId = (!courseId || courseId === 'Unassigned') ? null : courseId;

  const [step, setStep] = useState<'paste' | 'review'>('paste');
  // Initialize immediately from URL params so the picker shows a pre-selection even
  // before (or if) GET /courses resolves — upgraded to the real Course object once loaded.
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(() => {
    if (!paramCourseId) return null;
    return {
      id: paramCourseId,
      user_id: '',
      name: courseName || 'Selected Course',
      code: null,
      quarter: null,
      color: null,
      source: 'ics',
      created_at: '',
    };
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [quarter, setQuarter] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [jobId, setJobId] = useState('');
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    if (user?.current_quarter && !quarter) {
      setQuarter(user.current_quarter);
    }
  }, [user?.current_quarter]);

  // Upgrade pseudo-course to the real API object once courses load
  useEffect(() => {
    if (!paramCourseId || courses.length === 0) return;
    const match = courses.find((c) => c.id === paramCourseId);
    if (match) setSelectedCourse(match);
  }, [paramCourseId, courses]);

  // When GET /courses is empty, fall back to showing just the pre-selected course in the picker
  const pickerCourses = courses.length > 0 ? courses : (selectedCourse ? [selectedCourse] : []);

  async function handleSave() {
    const trimmedText = text.trim();
    if (!selectedCourse) {
      setSaveError('Please select a course first.');
      return;
    }
    if (!trimmedText) {
      setSaveError('Please paste your syllabus text first.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      const res = await extractSyllabus(
        selectedCourse.id,
        quarter.trim() || user?.current_quarter || '',
        trimmedText,
      );
      setJobId(res.jobId);

      if (res.tasks.length === 0) {
        // No dated assignments found — confirm immediately to save for RAG, skip review
        await confirmSyllabus(res.jobId, []);
        Alert.alert(
          'Syllabus saved',
          "Wick can now answer questions about your course policies, grading, and more.",
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        setTasks(res.tasks);
        setStep('review');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'Could not save syllabus. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(tasksToSave: ExtractedTask[]) {
    setConfirmError('');
    setConfirming(true);
    try {
      await confirmSyllabus(jobId, tasksToSave);
      if (tasksToSave.length > 0) {
        qc.invalidateQueries({ queryKey: ['tasks'] });
      }
      const msg =
        tasksToSave.length > 0
          ? `Syllabus saved and ${tasksToSave.length} assignment${tasksToSave.length !== 1 ? 's' : ''} added to your TODO list.`
          : "Syllabus saved. Wick can now answer questions about your course.";
      Alert.alert('Done', msg, [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      setConfirmError('Could not save. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  function updateTask(index: number, changes: Partial<ExtractedTask>) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...changes } : t)));
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  if (step === 'review') {
    return (
      <SafeAreaView style={ts.safe} edges={['top']}>
        <View style={ts.header}>
          <View style={ts.headerRow}>
            <TouchableOpacity onPress={() => setStep('paste')} style={{ paddingRight: 16 }}>
              <Text style={ts.subtitle}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={ts.title}>Assignments found</Text>
            <View style={{ width: 48 }} />
          </View>
          <Text style={[ts.subtitle, { marginTop: 4 }]}>
            Wick found {tasks.length} assignment{tasks.length !== 1 ? 's' : ''} with due dates — add them to your TODO?
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={m.reviewList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tasks.map((task, i) => {
            const { label, color } = priorityInfo(task.weight);
            return (
              <View key={i} style={m.taskCard}>
                <View style={m.taskCardRow}>
                  <View style={[m.priorityBadge, { backgroundColor: color + '28', borderColor: color }]}>
                    <Text style={[m.priorityText, { color }]}>{label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeTask(i)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={m.taskTitle}
                  value={task.title}
                  onChangeText={(v) => updateTask(i, { title: v })}
                  placeholder="Assignment title"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <TextInput
                  style={m.taskDate}
                  value={task.due_date ?? ''}
                  onChangeText={(v) => updateTask(i, { due_date: v || null })}
                  placeholder="Due date (YYYY-MM-DD)"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            );
          })}
        </ScrollView>

        {confirmError ? <Text style={m.errorText}>{confirmError}</Text> : null}

        <View style={m.footer}>
          <TouchableOpacity
            style={[m.primaryBtn, confirming && m.btnDisabled]}
            onPress={() => handleConfirm(tasks)}
            disabled={confirming}
            activeOpacity={0.8}
          >
            {confirming ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={m.primaryBtnText}>
                Add {tasks.length} assignment{tasks.length !== 1 ? 's' : ''} to TODO
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={m.skipBtn}
            onPress={() => handleConfirm([])}
            disabled={confirming}
            activeOpacity={0.7}
          >
            <Text style={m.skipText}>Save syllabus without adding tasks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ts.safe} edges={['top']}>
      <View style={ts.header}>
        <View style={ts.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
            <Text style={ts.subtitle}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={ts.title}>Upload Syllabus</Text>
          <View style={{ width: 48 }} />
        </View>
      </View>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={m.modalBackdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={m.modalSheet} onPress={() => {}}>
            <View style={m.modalHeader}>
              <Text style={m.modalTitle}>Select a course</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerCourses}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    m.courseRow,
                    selectedCourse?.id === item.id && m.courseRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedCourse(item);
                    setPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  {item.color ? (
                    <View style={[m.courseDot, { backgroundColor: item.color }]} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={m.courseName}>{item.name}</Text>
                    {item.quarter ? (
                      <Text style={m.courseQuarter}>{item.quarter}</Text>
                    ) : null}
                  </View>
                  {selectedCourse?.id === item.id ? (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[m.helper, { textAlign: 'center', padding: 24 }]}>
                  No courses found. Connect Canvas to import courses.
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={m.pasteScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={m.label}>Course</Text>
            <TouchableOpacity
              style={[m.input, m.pickerRow]}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  m.pickerText,
                  !selectedCourse && { color: Colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {selectedCourse ? selectedCourse.name : 'Select a course…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View>
            <Text style={m.label}>Quarter</Text>
            <TextInput
              style={m.input}
              value={quarter}
              onChangeText={setQuarter}
              placeholder="e.g. Spring 2026"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={m.label}>Syllabus text</Text>
            <Text style={m.helper}>
              Wick will save your syllabus so it can answer questions about course policies,
              grading, office hours, and more. If your syllabus lists assignments with due dates,
              you'll get the option to add them to your TODO list.
            </Text>
            <TextInput
              style={m.textArea}
              value={text}
              onChangeText={(v) => {
                setText(v);
                setSaveError('');
              }}
              placeholder="Paste your syllabus here…"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={m.footer}>
          {saveError ? <Text style={m.errorText}>{saveError}</Text> : null}
          <TouchableOpacity
            style={[m.primaryBtn, saving && m.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={m.primaryBtnText}>Save syllabus</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const m = StyleSheet.create({
  pasteScroll: {
    padding: 16,
    gap: 20,
    paddingBottom: 8,
  },
  reviewList: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  helper: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 8,
    lineHeight: FontSizes.sm * 1.5,
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  textArea: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    minHeight: 160,
    maxHeight: 260,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: '#F76A6A',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center' as const,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  footer: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  skipBtn: {
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  taskCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  taskCardRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },
  taskTitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingVertical: 4,
  },
  taskDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingVertical: 4,
  },
  pickerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  pickerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end' as const,
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%' as any,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  courseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 10,
  },
  courseRowSelected: {
    backgroundColor: Colors.primary + '14',
  },
  courseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  courseName: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  courseQuarter: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
