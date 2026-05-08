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
    alignItems: 'center' as const,
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
