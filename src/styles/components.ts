import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export const badgeStyles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start' as const,
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    fontWeight: '600' as const,
  },
});
