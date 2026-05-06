import { View, Text, TouchableOpacity } from 'react-native';
import { todoStyles as s } from '@/src/styles/todo';

export type TaskFilter = 'all' | 'week' | 'highlighted';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'week', label: 'This Week' },
  { key: 'highlighted', label: 'Highlighted' },
];

interface Props {
  active: TaskFilter;
  onChange: (f: TaskFilter) => void;
}

export default function TaskFilterBar({ active, onChange }: Props) {
  return (
    <View style={s.filterBar}>
      {FILTERS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[s.filterPill, active === key && s.filterPillActive]}
          onPress={() => onChange(key)}
          activeOpacity={0.7}
        >
          <Text style={[s.filterPillText, active === key && s.filterPillTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
