import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

interface HeroCardProps {
  name: string;
  dateLabel: string;
  weekLabel?: string;
}

export function HeroCard({ name, dateLabel, weekLabel }: HeroCardProps) {
  const subtitle = weekLabel ? `${dateLabel} · ${weekLabel}` : dateLabel;

  return (
    <View style={styles.hero}>
      <Text style={styles.stars}>✦ ✦ · ✦ · ✦</Text>
      <Text style={styles.greeting}>Hello, {name}! ✌️</Text>
      <Text style={styles.date}>{subtitle}</Text>
      <View style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.heroGrad1,
    borderRadius: 20,
    padding: 28,
    overflow: 'hidden',
    minHeight: 130,
    // React Native doesn't support CSS linear-gradient natively without
    // expo-linear-gradient, so we use a flat hero background for now.
    // The visual effect is achieved via the glow overlay below.
  },
  stars: {
    position: 'absolute',
    top: 14,
    right: 20,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    letterSpacing: 4,
  },
  greeting: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    color: Colors.white,
    marginBottom: 6,
  },
  date: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: 'rgba(255,255,255,0.7)',
  },
  glow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.glowPurple,
  },
});
