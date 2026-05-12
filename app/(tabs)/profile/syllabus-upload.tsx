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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/src/hooks/useUser';
import { extractSyllabus, confirmSyllabus, type ExtractedTask } from '@/src/api/syllabus';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { tabScreenStyles as ts } from '@/src/styles/tabs';

function priorityInfo(weight: number): { label: string; color: string } {
  if (weight >= 2.0) return { label: 'High', color: '#F76A6A' };
  if (weight >= 1.0) return { label: 'Medium', color: '#F7A06A' };
  return { label: 'Low', color: '#6AF7C8' };
}

export default function SyllabusUploadScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data: user } = useUser();
  const qc = useQueryClient();

  const resolvedCourseId = (!courseId || courseId === 'Unassigned') ? null : courseId;

  const [step, setStep] = useState<'paste' | 'review'>('paste');
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

  async function handleSave() {
    const trimmedText = text.trim();
    if (!trimmedText) {
      setSaveError('Please paste your syllabus text first.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      const res = await extractSyllabus(
        resolvedCourseId,
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
        {resolvedCourseId ? (
          <Text style={[ts.subtitle, { marginTop: 4 }]}>{resolvedCourseId}</Text>
        ) : null}
      </View>

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
});
