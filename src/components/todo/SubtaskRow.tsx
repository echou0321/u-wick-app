import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { todoStyles as s } from '@/src/styles/todo';
import type { TaskSubtask } from '@/src/types/api';

interface Props {
  subtask: TaskSubtask;
}

export default function SubtaskRow({ subtask }: Props) {
  const formattedStart = subtask.suggested_start
    ? new Date(subtask.suggested_start).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <View style={s.subtaskRow}>
      <Ionicons
        name={subtask.done ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={subtask.done ? Colors.primary : Colors.textMuted}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[s.subtaskTitle, subtask.done && s.subtaskDone]}>
          {subtask.title}
        </Text>
        {formattedStart && (
          <Text style={s.subtaskHint}>Start by {formattedStart}</Text>
        )}
      </View>
    </View>
  );
}
