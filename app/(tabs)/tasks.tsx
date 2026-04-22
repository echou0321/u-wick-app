import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  SectionListData,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { TaskRow } from '@/components/dashboard/TaskRow';
import { useAppContext } from '@/context/AppContext';
import { Task } from '@/types';

interface Section {
  title: string;
  data: Task[];
}

export default function TasksScreen() {
  const { tasks, toggleTask } = useAppContext();

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);

  const sections: Section[] = [
    { title: 'Pending', data: pending },
    ...(completed.length > 0
      ? [{ title: 'Completed', data: completed }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tasks</Text>
        <Text style={styles.count}>{pending.length} remaining</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskWrap}>
            <TaskRow task={item} onToggle={toggleTask} />
          </View>
        )}
        renderSectionHeader={({ section }: { section: SectionListData<Task, Section> }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  count: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  list: { padding: 20, gap: 4, paddingBottom: 40 },
  sectionHeader: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  taskWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
