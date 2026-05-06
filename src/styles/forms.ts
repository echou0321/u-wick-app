import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export const formStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  orbTopRight: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -100,
    right: -100,
    borderRadius: 9999,
    backgroundColor: 'rgba(124, 106, 247, 0.11)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center' as const,
  },
  logo: {
    alignItems: 'center' as const,
    marginBottom: 36,
  },
  mark: {
    fontSize: 18,
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 6,
  },
  wordmark: {
    fontFamily: Fonts.heading,
    fontSize: 40,
    color: Colors.primaryLight,
    letterSpacing: -1.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  apiError: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: '#F76A6A',
    backgroundColor: 'rgba(247,106,106,0.10)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: '#F76A6A',
  },
  fieldError: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: '#F76A6A',
    marginTop: 4,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 24,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  footerLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
});
