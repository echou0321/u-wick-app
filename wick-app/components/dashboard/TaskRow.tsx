import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { Task } from '@/types';

interface TaskRowProps {
  task: Task;
  onToggle?: (id: string) => void;
}

export function TaskRow({ task, onToggle }: TaskRowProps) {
  const dotColor = task.done
    ? Colors.accentTeal
    : task.highlight
    ? Colors.accentYellow
    : Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.row, task.highlight && styles.rowHighlight]}
      onPress={() => onToggle?.(task.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text
        style={[
          styles.label,
          task.done && styles.labelDone,
        ]}
        numberOfLines={2}
      >
        {task.label}
      </Text>
      <Text style={[styles.due, task.highlight && styles.dueHighlight]}>
        {task.due}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceRaised,
  },
  rowHighlight: {
    backgroundColor: 'rgba(247, 208, 106, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.primaryLight,
  },
  labelDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  due: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  dueHighlight: {
    color: Colors.accentYellow,
  },
});
