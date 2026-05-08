import React, { useState } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useUser } from '@/src/hooks/useUser';
import { updatePushToken } from '@/src/api/users';
import { tabScreenStyles as styles } from '@/src/styles/tabs';
import { Colors } from '@/constants/colors';

export default function ProfileNotificationsScreen() {
  const { data: user, isLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  async function handleEnable() {
    setLoading(true);
    try {
      const perms = await Notifications.requestPermissionsAsync();
      if (perms.status !== 'granted') {
        Alert.alert('Notifications not enabled', 'Permission was not granted.');
        return;
      }

      const tokenRes = await Notifications.getExpoPushTokenAsync();
      await updatePushToken(tokenRes.data);

      qc.invalidateQueries({ queryKey: ['user'] });
      Alert.alert('Enabled', 'Notifications are now enabled.');
      router.back();
    } catch {
      // In Expo Go or with restricted device environments, token retrieval can fail.
      Alert.alert('Something went wrong', 'Could not enable notifications. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={{ paddingRight: 16 }}>
              <Text style={styles.subtitle}>‹ Back</Text>
            </Pressable>
            <Text style={styles.title}>Notifications</Text>
            <View style={{ width: 48 }} />
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={{ paddingRight: 16 }}>
            <Text style={styles.subtitle}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          <View style={{ width: 48 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.profileBody}>
        <View style={styles.profileCard}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={styles.profileMeta}>{user?.notif_active ? 'Enabled' : 'Disabled'}</Text>

          <Pressable
            style={[styles.syncBtn, loading || user?.notif_active ? styles.btnDisabled : null]}
            onPress={handleEnable}
            disabled={loading || !!user?.notif_active}
          >
            <Text style={styles.syncBtnText}>
              {loading ? 'Enabling...' : user?.notif_active ? 'Enabled' : 'Enable notifications'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

