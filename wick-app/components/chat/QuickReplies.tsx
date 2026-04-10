import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {replies.map((reply) => {
        const isUndo = reply === 'Undo';
        return (
          <TouchableOpacity
            key={reply}
            style={[styles.chip, isUndo && styles.chipUndo]}
            onPress={() => onSelect(reply)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isUndo && styles.chipTextUndo]}>
              {isUndo ? '↩ Undo' : reply}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipUndo: {
    backgroundColor: 'transparent',
    borderColor: '#3A2A2A',
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.primaryLight,
  },
  chipTextUndo: {
    color: Colors.textSecondary,
  },
});
