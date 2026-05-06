import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useUIStore } from '@/src/stores/uiStore';
import { connectIcs } from '@/src/api/ics';
import { wizardStyles as ws } from '@/src/styles/wizard';
import { Colors } from '@/constants/colors';

export default function WizardStep1() {
  const { advanceWizard } = useUIStore();
  const slideAnim = useRef(new Animated.Value(320)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  function openModal() {
    setIcsUrl('');
    setUrlError('');
    setModalVisible(true);
  }

  async function handleConnect() {
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
    setLoading(true);
    try {
      const result = await connectIcs(trimmed);
      setModalVisible(false);
      Alert.alert('Canvas connected!', `${result.tasks_imported} tasks synced from Canvas.`);
      advanceWizard();
    } catch {
      setUrlError('Could not connect. Double-check your URL and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Dark backdrop */}
      <View style={ws.overlay} pointerEvents="auto" />

      {/* Calendar spotlight */}
      <View style={s.spotlightArea} pointerEvents="none">
        <View style={[ws.spotlight, s.calendarSpotlight]} />
      </View>

      {/* Tooltip card */}
      <Animated.View style={[ws.card, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ws.handle} />
        <View style={ws.skipRow}>
          <TouchableOpacity onPress={advanceWizard} hitSlop={12}>
            <Text style={ws.skipText}>Skip tutorial</Text>
          </TouchableOpacity>
        </View>
        <Text style={ws.cardTitle}>Import your Canvas calendar</Text>
        <Text style={ws.cardBody}>
          Paste your Canvas ICS URL to pull in all your assignments and due dates automatically.
          Find it in Canvas under Calendar → Feed.
        </Text>
        <TouchableOpacity style={ws.primaryBtn} onPress={openModal}>
          <Text style={ws.primaryBtnText}>Connect Canvas</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ICS URL entry modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
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
            <TouchableOpacity
              style={[ws.primaryBtn, { marginTop: 16 }]}
              onPress={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={ws.primaryBtnText}>Connect</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  spotlightArea: {
    position: 'absolute',
    top: 80,
    left: 24,
    right: 24,
    bottom: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSpotlight: {
    width: '100%',
    flex: 1,
    maxHeight: 340,
  },
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
