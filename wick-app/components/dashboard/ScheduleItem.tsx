import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { ScheduleBlock } from '@/types';

interface ScheduleItemProps {
  block: ScheduleBlock;
  showDay?: boolean;
}

export function ScheduleItem({ block, showDay }: ScheduleItemProps) {
  const timeLabel =
    showDay && block.day ? `${block.day} · ${block.time}` : block.time;

  return (
    <View style={[styles.item, { borderLeftColor: block.color }]}>
      <Text style={styles.time}>{timeLabel}</Text>
      <Text style={styles.course}>{block.course}</Text>
      {block.room && <Text style={styles.room}>{block.room}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingLeft: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  time: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  course: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  room: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
