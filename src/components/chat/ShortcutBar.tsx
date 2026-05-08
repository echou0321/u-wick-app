import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { shortcutBarStyles as styles } from '@/src/styles/chat';
import type { FlowMode } from '@/src/types/api';

interface Shortcut {
  label: string;
  flow: FlowMode;
  prefill: string;
}

const SHORTCUTS: Shortcut[] = [
  { label: 'Plan my week', flow: 'planning', prefill: 'Help me plan my study schedule for this week' },
  { label: 'Plan my quarter', flow: 'quarter_planning', prefill: "Let's plan out my whole quarter" },
  { label: 'Major advising', flow: 'advising', prefill: 'Tell me about requirements for my target major' },
  { label: 'Am I on track?', flow: 'free', prefill: 'Am I on track with my coursework this week?' },
  { label: 'Start this now', flow: 'free', prefill: 'What should I work on right now?' },
];

interface ShortcutBarProps {
  activeFlow: FlowMode;
  enrollmentStatus?: string | null;
  onShortcutSelect: (flow: FlowMode, prefill: string) => void;
}

export function ShortcutBar({ activeFlow, enrollmentStatus, onShortcutSelect }: ShortcutBarProps) {
  const visible = SHORTCUTS.filter(
    (s) => !(s.flow === 'advising' && enrollmentStatus === 'in-major'),
  );

  return (
    <View style={styles.container}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {visible.map((s) => {
        const active = activeFlow === s.flow && s.flow !== 'free';
        return (
          <TouchableOpacity
            key={s.label}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onShortcutSelect(s.flow, s.prefill)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    </View>
  );
}
