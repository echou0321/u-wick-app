import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export const tabScreenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  profileBody: {
    padding: 20,
    gap: 14,
  },
  profileCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  profileName: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  profileMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
  },
  rowBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowStatic: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  rowValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  syncBtn: {
    margin: 14,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center' as const,
  },
  syncBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  logoutBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  logoutText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.accentOrange,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  placeholder: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
});

export const tabBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },
});
