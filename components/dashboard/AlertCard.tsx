import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

interface AlertCardProps {
  badge: string;
  title: string;
  body: string;
  extraBadge?: string;
  onDismiss: () => void;
  onTap: () => void;
}

export function AlertCard({
  badge,
  title,
  body,
  extraBadge,
  onDismiss,
  onTap,
}: AlertCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onTap} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.badge}>{badge}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {extraBadge && (
        <View style={styles.extraBadgeWrap}>
          <Text style={styles.extraBadgeText}>{extraBadge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1428',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.xs,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dismiss: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  title: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  extraBadgeWrap: {
    marginTop: 10,
    backgroundColor: Colors.bubbleProactive,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  extraBadgeText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.primaryLight,
  },
});
