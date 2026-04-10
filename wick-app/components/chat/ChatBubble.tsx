import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { ChatMessage } from '@/types';
import {
  ELIGIBILITY_ITEMS,
  APPLICATION_CHECKLIST,
} from '@/data/mock-state';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isBot = message.role === 'assistant';

  return (
    <View style={[styles.wrapper, isBot ? styles.wrapperBot : styles.wrapperUser]}>
      {/* Proactive label above first proactive message */}
      {message.isProactive && (
        <Text style={styles.proactiveLabel}>✦ Wick reached out to you</Text>
      )}

      <View
        style={[
          styles.bubble,
          isBot ? styles.bubbleBot : styles.bubbleUser,
          message.isProactive && styles.bubbleProactive,
          message.isUpload && styles.bubbleUpload,
          message.isCanvas && styles.bubbleCanvas,
        ]}
      >
        <Text
          style={[
            styles.text,
            !isBot && styles.textUser,
            message.isUpload && styles.textUpload,
            message.isCanvas && styles.textCanvas,
          ]}
        >
          {message.text}
        </Text>

        {/* Inline pill: schedule preview */}
        {message.showSchedulePreview && (
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>📅 Added to your calendar</Text>
          </View>
        )}

        {/* Inline pill: notification set */}
        {message.showNotifPreview && (
          <View style={[styles.previewPill, styles.previewPillTeal]}>
            <Text style={[styles.previewPillText, styles.previewPillTextTeal]}>
              📱 Daily texts set for 7:30am
            </Text>
          </View>
        )}

        {/* Inline pill: deadline added */}
        {message.showDeadlineAdded && (
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>📅 Added to your calendar</Text>
          </View>
        )}
      </View>

      {/* Eligibility status card */}
      {message.showStatusCard && (
        <View style={styles.inlineCard}>
          <Text style={styles.inlineCardTitle}>📋 Your eligibility snapshot</Text>
          {ELIGIBILITY_ITEMS.map((item, i) => (
            <Text
              key={i}
              style={[
                styles.inlineCardRow,
                { color: item.startsWith('🎓') ? Colors.accentYellow : Colors.accentTeal },
              ]}
            >
              {item}
            </Text>
          ))}
        </View>
      )}

      {/* Application checklist */}
      {message.showChecklist && (
        <View style={styles.inlineCard}>
          <Text style={styles.inlineCardTitle}>✅ Application checklist</Text>
          {APPLICATION_CHECKLIST.map((item, i) => (
            <View key={i} style={styles.checklistRow}>
              <Text style={{ color: item.done ? Colors.accentTeal : Colors.textMuted, fontSize: 13 }}>
                {item.done ? '✓' : '○'}
              </Text>
              <Text style={[styles.checklistLabel, { opacity: item.done ? 0.5 : 1 }]}>
                {item.label}
              </Text>
              {item.link && <Text style={styles.linkTag}>Open →</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '88%',
  },
  wrapperBot: {
    alignSelf: 'flex-start',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
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
  bubbleProactive: {
    backgroundColor: Colors.bubbleProactive,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  bubbleUpload: {
    backgroundColor: Colors.accentGreen,
  },
  bubbleCanvas: {
    backgroundColor: Colors.accentRed,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: FontSizes.base * 1.55,
  },
  textUser: {
    color: Colors.textPrimary,
  },
  textUpload: {
    color: Colors.accentTeal,
  },
  textCanvas: {
    color: Colors.accentOrange,
  },
  proactiveLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    alignSelf: 'center',
  },
  previewPill: {
    marginTop: 10,
    backgroundColor: Colors.bubbleProactive,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  previewPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.primaryLight,
  },
  previewPillTeal: {
    backgroundColor: Colors.accentGreen,
  },
  previewPillTextTeal: {
    color: Colors.accentTeal,
  },
  inlineCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  inlineCardTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inlineCardRow: {
    fontFamily: Fonts.body,
    fontSize: 13,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceRaised,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceRaised,
  },
  checklistLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.primaryLight,
  },
  linkTag: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.primary,
  },
});
