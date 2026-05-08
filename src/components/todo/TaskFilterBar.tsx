import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { todoStyles as s } from '@/src/styles/todo';

export type TaskFilter = 'all' | 'week' | 'overdue' | 'starred' | 'completed';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'week', label: 'This Week' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'starred', label: 'Starred' },
  { key: 'completed', label: 'Completed' },
];

interface Props {
  active: TaskFilter;
  onChange: (f: TaskFilter) => void;
}

export default function TaskFilterBar({ active, onChange }: Props) {
  return (
    <View style={s.filterBarOuter}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterBar}
      >
        {FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.filterPill, active === key && s.filterPillActive]}
            onPress={() => onChange(key)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterPillText, active === key && s.filterPillTextActive]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
