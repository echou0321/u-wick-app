import React from 'react';
import { View, Text } from 'react-native';
import { flowPillStyles as styles } from '@/src/styles/chat';
import { Colors } from '@/constants/colors';
import type { FlowMode } from '@/src/types/api';

const FLOW_LABELS: Record<FlowMode, string> = {
  free: 'Chat',
  planning: 'Planning mode',
  advising: 'Advising mode',
  quarter_planning: 'Quarter planning',
  proactive: 'Check-in',
};

const FLOW_COLORS: Record<FlowMode, string> = {
  free: Colors.primary,
  planning: Colors.accentTeal,
  advising: Colors.accentYellow,
  quarter_planning: Colors.accentOrange,
  proactive: Colors.primaryLight,
};

interface FlowPillProps {
  flow: FlowMode;
}

export function FlowPill({ flow }: FlowPillProps) {
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: FLOW_COLORS[flow] }]} />
      <Text style={styles.label}>{FLOW_LABELS[flow]}</Text>
    </View>
  );
}
