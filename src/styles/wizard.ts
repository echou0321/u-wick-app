import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export const wizardStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  // Spotlight box — glowing rectangle highlighting a UI region
  spotlight: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124, 106, 247, 0.06)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  // Slide-up tooltip card anchored to the bottom of the screen
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 44,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  skipText: {
    color: Colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  cardBody: {
    color: Colors.textSecondary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
  },
  // Feature rows used in WizardStep3
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    marginBottom: 2,
  },
  featureBody: {
    color: Colors.textSecondary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
});
