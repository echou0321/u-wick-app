import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/src/stores/uiStore';
import { wizardStyles as ws } from '@/src/styles/wizard';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IoniconName; title: string; body: string }[] = [
  {
    icon: 'calendar-outline',
    title: 'Schedule tasks',
    body: 'Ask me to block study time before your next exam or paper.',
  },
  {
    icon: 'school-outline',
    title: 'Major advising',
    body: 'Ask about prerequisites and application deadlines for your target major.',
  },
  {
    icon: 'notifications-outline',
    title: 'Proactive reminders',
    body: "I'll nudge you when a big assignment is coming up with no study time planned.",
  },
];

export default function WizardStep3() {
  const { completeWizard } = useUIStore();
  const slideAnim = useRef(new Animated.Value(440)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 55,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Light dimming — no spotlight, just soften the background */}
      <View style={s.dimOverlay} pointerEvents="auto" />

      <Animated.View style={[ws.card, s.tallCard, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ws.handle} />

        <Text style={[ws.cardTitle, s.bigTitle]}>Here's what else U-Wick can do</Text>

        <View style={s.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={ws.featureRow}>
              <View style={ws.featureIcon}>
                <Ionicons name={f.icon} size={18} color={Colors.primary} />
              </View>
              <View style={s.featureText}>
                <Text style={ws.featureTitle}>{f.title}</Text>
                <Text style={ws.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={ws.primaryBtn} onPress={completeWizard}>
          <Text style={ws.primaryBtnText}>Let's go</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  tallCard: {
    paddingTop: 20,
  },
  bigTitle: {
    fontSize: 22,
    marginBottom: 24,
  },
  featureList: {
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
  },
});
