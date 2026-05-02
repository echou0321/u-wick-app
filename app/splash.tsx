import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

const HOLD_MS = 1500;
const FADE_MS = 650;
const SLIDE_OFFSET = 28;

export default function SplashScreen() {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Wordmark: fade in + spring up from below
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
      Animated.spring(contentY, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fades in shortly after wordmark
    setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }).start();
    }, 220);

    // Staggered dot pulse
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 480, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 480, useNativeDriver: true }),
          Animated.delay(240),
        ])
      ).start();

    pulse(dot1, 0);
    pulse(dot2, 180);
    pulse(dot3, 360);

    // Navigate after hold time — replaced by real auth check in production
    const nav = setTimeout(() => router.replace('/(onboarding)'), HOLD_MS);
    return () => clearTimeout(nav);
  }, []);

  return (
    <View style={styles.root}>
      {/* Ambient glow orbs — depth without LinearGradient */}
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbMidLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />

      {/* Wordmark lockup */}
      <Animated.View
        style={[
          styles.lockup,
          { opacity: contentOpacity, transform: [{ translateY: contentY }] },
        ]}
      >
        <Text style={styles.mark}>✦</Text>
        <Text style={styles.wordmark}>Wick</Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your AI academic planner
        </Animated.Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow orbs simulate a soft radial gradient
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopRight: {
    width: 420,
    height: 420,
    top: -150,
    right: -130,
    backgroundColor: 'rgba(124, 106, 247, 0.13)',
  },
  orbMidLeft: {
    width: 220,
    height: 220,
    top: '32%',
    left: -90,
    backgroundColor: 'rgba(180, 100, 255, 0.09)',
  },
  orbBottomRight: {
    width: 200,
    height: 200,
    bottom: 60,
    right: -50,
    backgroundColor: 'rgba(106, 247, 200, 0.07)',
  },

  lockup: {
    alignItems: 'center',
  },
  mark: {
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 14,
    letterSpacing: 3,
  },
  wordmark: {
    fontFamily: Fonts.heading,
    fontSize: 58,
    color: Colors.primaryLight,
    letterSpacing: -2,
    lineHeight: 62,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    marginTop: 10,
    letterSpacing: 0.4,
  },

  dotsRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
