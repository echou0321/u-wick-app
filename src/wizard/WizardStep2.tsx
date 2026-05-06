import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useUIStore } from '@/src/stores/uiStore';
import { wizardStyles as ws } from '@/src/styles/wizard';

export default function WizardStep2() {
  const { advanceWizard } = useUIStore();
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Dark backdrop */}
      <View style={ws.overlay} pointerEvents="auto" />

      {/* Message input spotlight — highlights the input bar area above the tab bar */}
      <View style={s.spotlightArea} pointerEvents="none">
        <View style={[ws.spotlight, s.inputSpotlight]} />
      </View>

      {/* Tooltip card */}
      <Animated.View style={[ws.card, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ws.handle} />
        <View style={ws.skipRow}>
          <TouchableOpacity onPress={advanceWizard} hitSlop={12}>
            <Text style={ws.skipText}>Skip tutorial</Text>
          </TouchableOpacity>
        </View>
        <Text style={ws.cardTitle}>Ask U-Wick anything</Text>
        <Text style={ws.cardBody}>
          U-Wick can answer questions about your schedule, suggest when to study,
          and help you plan your quarter.
        </Text>
        <TouchableOpacity style={ws.primaryBtn} onPress={advanceWizard}>
          <Text style={ws.primaryBtnText}>Got it</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // Positioned above the tab bar (70px) + card height (~240px) + gap
  spotlightArea: {
    position: 'absolute',
    bottom: 326,
    left: 16,
    right: 16,
  },
  inputSpotlight: {
    height: 52,
    borderRadius: 28,
  },
});
