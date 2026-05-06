import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUIStore } from '@/src/stores/uiStore';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';

export default function CoachMarkWizard() {
  const { wizardCompleted, wizardStep, startWizard } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    if (wizardCompleted) return;
    if (wizardStep === 0) {
      startWizard();
    } else if (wizardStep === 1) {
      router.navigate('/(tabs)/schedule');
    } else if (wizardStep === 2) {
      router.navigate('/(tabs)/chat');
    }
  }, [wizardStep, wizardCompleted]);

  if (wizardCompleted || wizardStep === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {wizardStep === 1 && <WizardStep1 />}
      {wizardStep === 2 && <WizardStep2 />}
      {wizardStep === 3 && <WizardStep3 />}
    </View>
  );
}
