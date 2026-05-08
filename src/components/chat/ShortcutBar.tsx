import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { shortcutBarStyles as styles } from '@/src/styles/chat';
import type { FlowMode } from '@/src/types/api';

interface Prompt {
  label: string;
  prefill: string;
}

const FLOW_PROMPTS: Record<FlowMode, Prompt[]> = {
  free: [
    { label: 'Am I on track?', prefill: 'Am I on track with my coursework this week?' },
    { label: 'What to work on?', prefill: 'What should I work on right now?' },
  ],
  planning: [
    { label: 'Plan this week', prefill: 'Help me plan my study schedule for this week' },
  ],
  quarter_planning: [
    { label: 'Plan my quarter', prefill: "Let's plan out my whole quarter" },
  ],
  advising: [
    { label: 'My target major', prefill: 'Tell me about requirements for my target major' },
  ],
  proactive: [],
};

interface ShortcutBarProps {
  activeFlow: FlowMode;
  onPrefill: (text: string) => void;
}

export function ShortcutBar({ activeFlow, onPrefill }: ShortcutBarProps) {
  const prompts = FLOW_PROMPTS[activeFlow];
  if (!prompts.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {prompts.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={styles.pill}
            onPress={() => onPrefill(p.prefill)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
