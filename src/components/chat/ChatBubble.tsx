import React from 'react';
import { View, Text } from 'react-native';
import { bubbleStyles as styles } from '@/src/styles/chat';
import type { ChatMessage } from '@/src/types/api';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isBot = message.role === 'assistant';

  return (
    <View style={[styles.wrapper, isBot ? styles.wrapperBot : styles.wrapperUser]}>
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <Text style={styles.text}>{message.content}</Text>
      </View>
    </View>
  );
}
