import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export const bubbleStyles = StyleSheet.create({
  wrapper: {
    maxWidth: '88%',
  },
  wrapperBot: {
    alignSelf: 'flex-start' as const,
  },
  wrapperUser: {
    alignSelf: 'flex-end' as const,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleBot: {
    backgroundColor: Colors.bubbleBot,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.bubbleUser,
    borderBottomRightRadius: 4,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: FontSizes.base * 1.55,
  },
});

export const inputStyles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 18,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    maxHeight: 120,
    textAlignVertical: 'top' as const,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  sendIcon: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
  },
});

export const markdownStyles = {
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: FontSizes.base * 1.55,
  },
  strong: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textPrimary,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  code_inline: {
    fontFamily: 'Courier',
    fontSize: FontSizes.sm,
    backgroundColor: Colors.border,
    color: Colors.accentTeal,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  code_block: {
    fontFamily: 'Courier',
    fontSize: FontSizes.sm,
    backgroundColor: Colors.border,
    color: Colors.accentTeal,
    borderRadius: 6,
    padding: 10,
    marginVertical: 4,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  heading1: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  heading2: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
};

export const flowPillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});

export const shortcutBarStyles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 52,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center' as const,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignSelf: 'center' as const,
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.bubbleUser,
  },
  pillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.primaryLight,
  },
});

export const flowTabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'stretch' as const,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingLeft: 8,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  labelActive: {
    color: Colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center' as const,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
});

export const glanceStyles = StyleSheet.create({
  wrap: {
    paddingBottom: 12,
    gap: 18,
  },
  greeting: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    color: Colors.textPrimary,
    lineHeight: FontSizes['3xl'] * 1.15,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  summaryText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    lineHeight: FontSizes.lg * 1.55,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  todoRowLast: {
    borderBottomWidth: 0,
  },
  todoTitle: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  todoTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  emptyLine: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scheduleRowLast: {
    borderBottomWidth: 0,
  },
  scheduleBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 36,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  scheduleTime: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
});

export const chatScreenStyles = StyleSheet.create({
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexGrow: 1,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.accentOrange,
    textAlign: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  offlineBanner: {
    backgroundColor: Colors.accentYellow,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  offlineText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.bg,
    textAlign: 'center' as const,
  },
});

export const typingStyles = StyleSheet.create({
  bubble: {
    backgroundColor: Colors.bubbleBot,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
    flexDirection: 'row' as const,
    gap: 5,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    width: 70,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
