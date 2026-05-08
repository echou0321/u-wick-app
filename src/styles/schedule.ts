import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export const scheduleStyles = StyleSheet.create({
  // ── Offline banner ────────────────────────────────────────────
  offlineBanner: {
    backgroundColor: '#3A2E00',
    borderBottomWidth: 1,
    borderBottomColor: '#6A5200',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBannerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: '#F7D06A',
  },

  // ── Heat map ──────────────────────────────────────────────────
  heatSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heatBar: {
    flexDirection: 'row',
    gap: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  heatSegment: {
    flex: 1,
    height: 10,
    borderRadius: 3,
  },
  heatToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heatLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },

  // ── Block list ────────────────────────────────────────────────
  blocksSection: {
    flex: 1,
  },
  blocksSectionTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  blockCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blockColorBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 36,
  },
  blockContent: {
    flex: 1,
  },
  blockTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  blockTime: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  blockTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  blockTypeBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // ── Bottom sheet form ─────────────────────────────────────────
  sheetHandle: {
    backgroundColor: Colors.borderSubtle,
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sheetBody: {
    paddingHorizontal: 20,
    gap: 14,
  },
  sheetLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sheetInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  sheetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetInputHalf: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  typePillTextActive: {
    color: Colors.white,
  },
  sheetSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetSaveBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  sheetDeleteBtn: {
    backgroundColor: Colors.accentRed,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A1A0E',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  sheetDeleteBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: '#F76A6A',
  },
});
