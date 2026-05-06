import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { updatePushToken, completeOnboarding } from '@/src/api/users';
import { startSession } from '@/src/api/sessions';
import { formStyles as styles } from '@/src/styles/forms';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

const NOTIF_FEATURES = [
  {
    icon: 'sunny-outline' as const,
    title: 'Morning digest',
    body: "Today's tasks and upcoming deadlines, first thing in the morning.",
  },
  {
    icon: 'flash-outline' as const,
    title: 'Start this now',
    body: 'Timely nudges when a high-priority assignment needs your attention.',
  },
  {
    icon: 'school-outline' as const,
    title: 'Major deadline reminders',
    body: 'Stay ahead of application deadlines for your target major.',
  },
];

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(false);

  async function completeAndNavigate() {
    try {
      await completeOnboarding();
    } catch {}
    startSession('free'); // fire-and-forget
    router.replace('/(tabs)/chat');
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        try {
          const { data: token } = await Notifications.getExpoPushTokenAsync();
          await updatePushToken(token);
        } catch {
          // push token unavailable in Expo Go — silently continue
        }
      }
    } catch {}
    await completeAndNavigate();
  }

  async function handleSkip() {
    setLoading(true);
    await completeAndNavigate();
  }

  return (
    <View style={styles.root}>
      <View style={styles.orbTopRight} />

      <View style={local.container}>
        <View style={styles.logo}>
          <Text style={styles.mark}>✦</Text>
          <Text style={styles.wordmark}>Wick</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Stay on track</Text>
          <Text style={local.subtitle}>
            U-Wick can send you helpful reminders so nothing slips through the cracks.
          </Text>

          {NOTIF_FEATURES.map((item) => (
            <View key={item.title} style={local.row}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} style={local.rowIcon} />
              <View style={local.rowText}>
                <Text style={local.rowTitle}>{item.title}</Text>
                <Text style={local.rowBody}>{item.body}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, local.btnSpacing, loading ? styles.btnDisabled : null]}
            onPress={handleEnable}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.btnText}>Enable Notifications</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={local.skip} onPress={handleSkip} disabled={loading}>
          <Text style={local.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: FontSizes.base * 1.55,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rowIcon: {
    marginTop: 1,
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: FontSizes.sm * 1.55,
  },
  btnSpacing: {
    marginTop: 20,
  },
  skip: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
