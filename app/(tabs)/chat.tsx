import React, { useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  ListRenderItem,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatEngine } from '@/hooks/useChatEngine';
import { useAppContext } from '@/context/AppContext';
import { ChatMessage } from '@/types';

export default function ChatScreen() {
  const { activeChatFlow } = useAppContext();
  const { messages, isTyping, sendMessage, handleQuickReply } =
    useChatEngine(activeChatFlow);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isTyping]);

  const lastMsg = messages[messages.length - 1];

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => (
    <ChatBubble message={item} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wick</Text>
        <Text style={styles.headerSub}>🕐 History</Text>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingWrap}>
              <TypingIndicator />
            </View>
          ) : null
        }
      />

      {/* Quick replies */}
      {!isTyping && lastMsg?.quickReplies && (
        <QuickReplies
          replies={lastMsg.quickReplies}
          onSelect={handleQuickReply}
        />
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.primaryLight,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  separator: { height: 10 },
  typingWrap: { marginTop: 10 },
});
