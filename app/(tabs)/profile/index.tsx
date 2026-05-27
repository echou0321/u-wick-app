import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { tabScreenStyles as styles } from '@/src/styles/tabs';
import { useUser } from '@/src/hooks/useUser';
import { useIcsStatus } from '@/src/hooks/useIcsStatus';
import { connectIcs, syncIcs, disconnectIcs } from '@/src/api/ics';
import { logEvent } from '@/src/api/sessions';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors } from '@/constants/colors';

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

  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const connectMutation = useMutation({
    mutationFn: connectIcs,
    onSuccess: async (result) => {
      setConnectModalVisible(false);
      setIcsUrl('');
      setUrlError('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['ics-status'] }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
      Alert.alert('Canvas connected!', `${result.tasks_imported} tasks synced from Canvas.`);
    },
    onError: () => {
      setUrlError('Could not connect. Double-check your URL and try again.');
    },
  });

  function handleConnect() {
    const trimmed = icsUrl.trim();
    if (!trimmed) {
      setUrlError('Please enter your Canvas ICS URL');
      return;
    }
    if (!trimmed.startsWith('https://')) {
      setUrlError('URL must start with https://');
      return;
    }
    setUrlError('');
    connectMutation.mutate(trimmed);
  }

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
          {icsStatus?.connected ? (
            <>
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
            </>
          ) : (
            <Pressable
              style={styles.syncBtn}
              onPress={() => {
                setIcsUrl('');
                setUrlError('');
                setConnectModalVisible(true);
              }}
            >
              <Text style={styles.syncBtnText}>Connect Canvas</Text>
            </Pressable>
          )}
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

      <Modal
        visible={connectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConnectModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalBackdrop}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Canvas ICS URL</Text>
              <TextInput
                style={[s.input, urlError ? s.inputError : undefined]}
                placeholder="https://canvas.uw.edu/feeds/calendars/..."
                placeholderTextColor={Colors.textMuted}
                value={icsUrl}
                onChangeText={(t) => {
                  setIcsUrl(t);
                  setUrlError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {urlError ? <Text style={s.errorText}>{urlError}</Text> : null}
              <Pressable
                style={[s.connectBtn, connectMutation.isPending ? s.connectBtnDisabled : null]}
                onPress={handleConnect}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={s.connectBtnText}>Connect</Text>
                )}
              </Pressable>
              <Pressable style={s.cancelBtn} onPress={() => setConnectModalVisible(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surfaceRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 24,
    paddingBottom: 44,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#F76A6A',
  },
  errorText: {
    color: '#F76A6A',
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 6,
  },
  connectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  connectBtnDisabled: {
    opacity: 0.5,
  },
  connectBtnText: {
    color: Colors.white,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: Colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
});
