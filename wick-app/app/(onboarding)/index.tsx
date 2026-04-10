import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

type Step = 'status' | 'major';

const MAJORS = [
  'Informatics',
  'Computer Science',
  'Human Centered Design & Engineering',
  'Other',
];

export default function OnboardingIndex() {
  const [step, setStep] = useState<Step>('status');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setStep('major');
  };

  const handleMajorSelect = (major: string) => {
    // In a real app we'd persist this to context/storage.
    // For the prototype, we just navigate forward.
    router.push('/(onboarding)/upload');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo */}
        <Text style={styles.logo}>Wick</Text>

        {step === 'status' ? (
          <>
            <View style={styles.heroGlow} />
            <Text style={styles.heading}>Welcome! 👋</Text>
            <Text style={styles.subheading}>
              I'm Wick, your academic planning assistant. Let's get you set up.
            </Text>
            <Text style={styles.question}>
              Are you currently Pre-major or already in a Major?
            </Text>
            <View style={styles.options}>
              {['Pre-major', 'In a Major'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionBtn}
                  onPress={() => handleStatusSelect(option)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heading}>
              Got it — {selectedStatus}! 🎯
            </Text>
            <Text style={styles.subheading}>
              What's your target major? This helps me tailor your course
              recommendations and track the right requirements.
            </Text>
            <View style={styles.options}>
              {MAJORS.map((major) => (
                <TouchableOpacity
                  key={major}
                  style={styles.optionBtn}
                  onPress={() => handleMajorSelect(major)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionText}>{major}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === 0 && styles.dotActive]}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flexGrow: 1,
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
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.glowPurple,
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
  question: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  options: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.primaryLight,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    paddingTop: 40,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderSubtle,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 18,
  },
});
