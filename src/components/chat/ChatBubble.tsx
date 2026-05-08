import React from 'react';
import { View, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { bubbleStyles as styles, markdownStyles } from '@/src/styles/chat';
import type { ChatMessage } from '@/src/types/api';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isBot = message.role === 'assistant';

  return (
    <View style={[styles.wrapper, isBot ? styles.wrapperBot : styles.wrapperUser]}>
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        {isBot ? (
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        ) : (
          <Text style={styles.text} selectable>{message.content}</Text>
        )}
      </View>
    </View>
  );
}
