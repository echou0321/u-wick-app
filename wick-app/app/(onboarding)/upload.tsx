import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

const MOCK_FILES = [
  'MATH307_syllabus.pdf',
  'INFO200_syllabus.pdf',
  'CSE163_syllabus.pdf',
];

export default function OnboardingUpload() {
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
  };

  const handleContinue = () => {
    router.push('/(onboarding)/connect');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>Wick</Text>

        <Text style={styles.heading}>Upload your syllabi 📚</Text>
        <Text style={styles.subheading}>
          I'll scan your syllabi and automatically extract deadlines, exams, and
          assignments — so nothing slips through the cracks.
        </Text>

        {!uploaded ? (
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadIcon}>📎</Text>
            <Text style={styles.uploadTitle}>Tap to upload syllabi PDFs</Text>
            <Text style={styles.uploadSub}>PDF, Word, or image files</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>✅ Syllabi scanned!</Text>
            {MOCK_FILES.map((file) => (
              <View key={file} style={styles.fileRow}>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileName}>{file}</Text>
                <Text style={styles.fileCheck}>✓</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <Text style={styles.resultsSummary}>
              Found 14 assignments, 3 exams, and 2 projects across your courses.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {!uploaded && (
            <TouchableOpacity onPress={handleContinue} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
          {uploaded && (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
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
  uploadBox: {
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: { fontSize: 36 },
  uploadTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.primaryLight,
    textAlign: 'center',
  },
  uploadSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  resultsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  resultsTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.md,
    color: Colors.accentTeal,
    marginBottom: 14,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceRaised,
  },
  fileIcon: { fontSize: 16 },
  fileName: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  fileCheck: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.accentTeal,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  resultsSummary: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: FontSizes.sm * 1.6,
  },
  footer: { marginTop: 32, alignItems: 'center' },
  skipBtn: { padding: 12 },
  skipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  continueBtnText: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.base,
    color: Colors.white,
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
  dotActive: { backgroundColor: Colors.primary, width: 18 },
});
