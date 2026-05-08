import { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { todoStyles as s } from '@/src/styles/todo';
import type { Task } from '@/src/types/api';

function formatDueDate(dueDate: string | null, done: boolean): { label: string; urgent: boolean } {
  if (!dueDate) return { label: 'No due date', urgent: false };
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) {
    if (done) {
      const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { label: `Due ${label}`, urgent: false };
    }
    return { label: 'Overdue', urgent: true };
  }
  if (diffDays === 0) return { label: 'Due today', urgent: true };
  if (diffDays === 1) return { label: 'Due tomorrow', urgent: true };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, urgent: false };
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label: `Due ${label}`, urgent: false };
}

function weightLabel(weight: number): string {
  if (weight >= 2.8) return 'Exam';
  if (weight >= 2.0) return 'Midterm';
  if (weight >= 1.3) return 'Lab / Report';
  if (weight >= 0.8) return 'Assignment / Quiz';
  if (weight > 0)   return 'Reading';
  return 'Task';
}

function weightColor(weight: number): string {
  if (weight >= 2.8) return '#F76A6A';
  if (weight >= 2.0) return '#F7A06A';
  if (weight >= 1.3) return '#F7D06A';
  if (weight >= 0.8) return Colors.primary;
  return Colors.textMuted;
}

interface Props {
  task: Task;
  onPress: () => void;
  onToggleStar: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
}

export default function TaskRow({ task, onPress, onToggleStar, onToggleDone, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const { label: dueDateLabel, urgent } = formatDueDate(task.due_date, task.done);
  const wColor = weightColor(task.weight);

  function renderRightActions(
    progress: Animated.AnimatedInterpolation<number>,
  ) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[s.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FFF" />
          <Text style={s.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={40}>
      <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
        <TouchableOpacity style={s.checkBox} onPress={onToggleDone} hitSlop={8}>
          <Ionicons
            name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={task.done ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>
        <View style={s.taskContent}>
          <Text style={[s.taskTitle, task.done && s.taskTitleDone]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={s.taskMeta}>
            <Text style={[s.dueDate, urgent && s.dueDateUrgent]}>{dueDateLabel}</Text>
            {task.weight > 0 && (
              <View
                style={[
                  s.weightBadge,
                  { borderColor: wColor + '55', backgroundColor: wColor + '18' },
                ]}
              >
                <Text style={[s.weightBadgeText, { color: wColor }]}>
                  {weightLabel(task.weight)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={s.starBtn} onPress={onToggleStar} hitSlop={8}>
          <Ionicons
            name={task.highlighted ? 'star' : 'star-outline'}
            size={18}
            color={task.highlighted ? Colors.accentYellow : Colors.textMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  );
}
