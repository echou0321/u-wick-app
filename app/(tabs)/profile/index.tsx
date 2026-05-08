import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { tabScreenStyles as styles } from '@/src/styles/tabs';
import { useUser } from '@/src/hooks/useUser';
import { useIcsStatus } from '@/src/hooks/useIcsStatus';
import { syncIcs, disconnectIcs } from '@/src/api/ics';
import { logEvent } from '@/src/api/sessions';
import { useAuthStore } from '@/src/stores/authStore';

function fmtDate(value: string | null) {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Never';
  return d.toLocaleString();
}

export default function ProfileScreen() {
  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: user, isLoading: userLoading, isError: userError } = useUser();
  const { data: icsStatus, isLoading: icsLoading } = useIcsStatus();

  const syncMutation = useMutation({
    mutationFn: syncIcs,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['ics-status'] }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
      logEvent('ics_synced', {}).catch(() => {});
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectIcs,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['ics-status'] }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
    },
  });

  function handleDisconnectIcs() {
    Alert.alert(
      'Disconnect Canvas?',
      'This will remove all Canvas tasks from your list. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectMutation.mutate(),
        },
      ],
    );
  }

  function handleLogout() {
    Alert.alert('Log out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (userLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C4B8FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (userError || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.placeholder}>Could not load profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.display_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.profileBody}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>
          <Text style={styles.profileName}>{user.display_name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileMeta}>
            {user.major || 'No major set'} · {user.enrollment_status || 'status unknown'}
          </Text>
          <Text style={styles.profileMeta}>{user.current_quarter || 'No quarter set'}</Text>
        </View>

        <View style={styles.listCard}>
          <Pressable
            style={styles.rowBtn}
            onPress={() => router.push('/(tabs)/profile/edit')}
          >
            <Text style={styles.rowLabel}>Edit Profile</Text>
            <Text style={styles.rowValue}>›</Text>
          </Pressable>
          <Pressable
            style={styles.rowBtn}
            onPress={() => router.push('/(tabs)/profile/courses')}
          >
            <Text style={styles.rowLabel}>My Courses</Text>
            <Text style={styles.rowValue}>›</Text>
          </Pressable>
          {user.enrollment_status === 'pre-major' ? (
            <Pressable
              style={styles.rowBtn}
              onPress={() => router.push('/(tabs)/profile/major-goals')}
            >
              <Text style={styles.rowLabel}>Major Goals</Text>
              <Text style={styles.rowValue}>›</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.listCard}>
          <Pressable style={styles.rowStatic} onPress={() => router.push('/(tabs)/profile/notifications')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowValue}>{user.notif_active ? 'Enabled' : 'Disabled'}</Text>
            </View>
            <Text style={[styles.rowValue, { color: user.notif_active ? '#C4B8FF' : '#7C6AF7' }]}>
              {user.notif_active ? 'Manage' : 'Enable'}
            </Text>
          </Pressable>
          <View style={styles.rowStatic}>
            <Text style={styles.rowLabel}>ICS Status</Text>
            <Text style={styles.rowValue}>
              {icsLoading
                ? 'Loading...'
                : (icsStatus?.connected ? 'Connected' : 'Not connected')}
            </Text>
          </View>
          <View style={styles.rowStatic}>
            <Text style={styles.rowLabel}>Last synced</Text>
            <Text style={styles.rowValue}>
              {icsLoading ? 'Loading...' : fmtDate(icsStatus?.last_synced ?? user.ics_last_synced)}
            </Text>
          </View>
          <Pressable
            style={[styles.syncBtn, syncMutation.isPending ? styles.btnDisabled : null]}
            onPress={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <Text style={styles.syncBtnText}>
              {syncMutation.isPending ? 'Syncing...' : 'Sync now'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.logoutBtn, disconnectMutation.isPending ? styles.btnDisabled : null]}
            onPress={handleDisconnectIcs}
            disabled={disconnectMutation.isPending}
          >
            <Text style={styles.logoutText}>
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect Canvas'}
            </Text>
          </Pressable>
        </View>

        {user.enrollment_status === 'in-major' ? (
          <View style={styles.listCard}>
            <Text style={styles.rowLabel}>My Major</Text>
            <Text style={styles.profileMeta}>{user.major || 'Not set'}</Text>
            <Text style={styles.profileMeta}>No goal checklist for in-major students.</Text>
          </View>
        ) : null}

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
