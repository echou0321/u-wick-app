import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export default function OnboardingConnect() {
  const [state, setState] = useState<'idle' | 'loading' | 'connected'>('idle');

  const handleConnect = () => {
    setState('loading');
    setTimeout(() => setState('connected'), 1800);
  };

  const handleFinish = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.logo}>Wick</Text>

        <Text style={styles.heading}>Connect Canvas 🔗</Text>
        <Text style={styles.subheading}>
          Link your Canvas account so I can sync your course data, track grades,
          and keep your deadlines up to date automatically.
        </Text>

        {/* Canvas card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View
              style={[
                styles.canvasLogo,
                state === 'connected' && styles.canvasLogoConnected,
              ]}
            >
              <Text style={styles.canvasLogoText}>C</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Canvas LMS</Text>
              <Text style={styles.cardSub}>University of Washington</Text>
            </View>
            {state === 'connected' && (
              <Text style={styles.connectedBadge}>✓ Connected</Text>
            )}
          </View>
        </View>

        {state === 'idle' && (
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={handleConnect}
            activeOpacity={0.85}
          >
            <Text style={styles.connectBtnText}>Connect Canvas Account</Text>
          </TouchableOpacity>
        )}

        {state === 'loading' && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Connecting to Canvas…</Text>
          </View>
        )}

        {state === 'connected' && (
          <View style={styles.successArea}>
            <Text style={styles.successMsg}>
              🎉 You're all set! I've synced your courses and loaded your schedule.
            </Text>
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.finishBtnText}>Go to my dashboard →</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'idle' && (
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.primaryLight,
    marginBottom: 48,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subheading: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: FontSizes.base * 1.65,
    marginBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  canvasLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E66000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasLogoConnected: {
    backgroundColor: Colors.accentGreen,
  },
  canvasLogoText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.white,
  },
  cardTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  cardSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  connectedBadge: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentTeal,
  },
  connectBtn: {
    backgroundColor: '#E66000',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectBtnText: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  successArea: { gap: 16 },
  successMsg: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.accentTeal,
    lineHeight: FontSizes.base * 1.65,
    backgroundColor: Colors.accentGreen,
    borderRadius: 12,
    padding: 14,
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishBtnText: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  skipBtn: { padding: 12, alignSelf: 'center' },
  skipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderSubtle,
  },
  dotActive: { backgroundColor: Colors.primary, width: 18 },
});
