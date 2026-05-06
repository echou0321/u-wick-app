import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { badgeStyles as styles } from '@/src/styles/components';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'teal' | 'orange' | 'yellow';
  style?: ViewStyle;
}

const BG: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: Colors.bubbleProactive,
  teal: Colors.accentGreen,
  orange: Colors.accentRed,
  yellow: 'rgba(247, 208, 106, 0.15)',
};

const TEXT_COLOR: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: Colors.primaryLight,
  teal: Colors.accentTeal,
  orange: Colors.accentOrange,
  yellow: Colors.accentYellow,
};

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: BG[variant] }, style]}>
      <Text style={[styles.text, { color: TEXT_COLOR[variant] }]}>{label}</Text>
    </View>
  );
}
