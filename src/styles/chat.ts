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
