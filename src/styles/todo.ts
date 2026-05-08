import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export const todoStyles = StyleSheet.create({
  // ── Filter bar ──────────────────────────────────────────────
  filterBarOuter: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.white,
  },

  // ── Task row ─────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 14,
    marginTop: 2,
    flexShrink: 0,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  taskTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through' as const,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  dueDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  dueDateUrgent: {
    color: '#F76A6A',
  },
  weightBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  weightBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },
  starBtn: {
    padding: 8,
    marginLeft: 4,
    flexShrink: 0,
  },

  // ── Swipe delete action ───────────────────────────────────────
  deleteAction: {
    backgroundColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteActionText: {
    color: '#FFF',
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    marginTop: 3,
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // ── Done checkbox ─────────────────────────────────────────────
  checkBox: {
    width: 22,
    height: 22,
    marginRight: 14,
    marginTop: 1,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Mark all overdue done ─────────────────────────────────────
  markAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  markAllBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },

  // ── Sort header row ───────────────────────────────────────────
  sortRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  sortLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },

  // ── Undo toast ────────────────────────────────────────────────
  undoToast: {
    position: 'absolute' as const,
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  undoToastText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  undoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  undoBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },

  // ── Subtask section ───────────────────────────────────────────
  subtaskSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  subtaskSectionTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  subtaskRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
  },
  subtaskTitle: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: FontSizes.base * 1.45,
  },
  subtaskDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through' as const,
  },
  subtaskHint: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // ── Detail screen ─────────────────────────────────────────────
  detailScroll: {
    flex: 1,
  },
  detailBody: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 14,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  detailValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  doneToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doneToggleLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  sourceBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },
  breakdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 16,
  },
  breakdownBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accentRed,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A1A0E',
    paddingVertical: 14,
    marginBottom: 32,
  },
  deleteBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: '#F76A6A',
  },
});
