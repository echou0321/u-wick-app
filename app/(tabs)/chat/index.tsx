import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { tabScreenStyles } from '@/src/styles/tabs';
import { chatScreenStyles as styles } from '@/src/styles/chat';
import { useChatHistory, useClearChatHistory } from '@/src/hooks/useChatHistory';
import { useChatStream } from '@/src/hooks/useChatStream';
import { useUser } from '@/src/hooks/useUser';
import { useChatStore } from '@/src/stores/chatStore';
import { useUIStore } from '@/src/stores/uiStore';
import { ChatBubble } from '@/src/components/chat/ChatBubble';
import { ChatInput } from '@/src/components/chat/ChatInput';
import { TypingIndicator } from '@/src/components/chat/TypingIndicator';
import { FlowPill } from '@/src/components/chat/FlowPill';
import { ShortcutBar } from '@/src/components/chat/ShortcutBar';
import type { ChatMessage, FlowMode } from '@/src/types/api';

type DisplayItem =
  | { kind: 'message'; msg: ChatMessage; key: string }
  | { kind: 'streaming'; content: string; key: string }
  | { kind: 'typing'; key: string };

export default function ChatScreen() {
  const { activeFlow, setFlow } = useChatStore();
  const { data: historyData, isLoading } = useChatHistory(activeFlow);
  const { sendMessage, isStreaming, streamingContent, error, clearError } =
    useChatStream(activeFlow);
  const { mutateAsync: clearHistory } = useClearChatHistory();
  const { data: user } = useUser();
  const isOffline = useUIStore((s) => s.offlineMode);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [prefill, setPrefill] = useState('');
  const listRef = useRef<FlatList>(null);

  // Reset when flow changes
  useEffect(() => {
    setInitialized(false);
    setLocalMessages([]);
  }, [activeFlow]);

  // Initialize from React Query on first load per flow
  useEffect(() => {
    if (!initialized && historyData !== undefined) {
      setLocalMessages(historyData);
      setInitialized(true);
    }
  }, [historyData, initialized]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages.length, isStreaming, streamingContent, scrollToBottom]);

  function handleSend(text: string) {
    clearError();
    setPrefill('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      flow: activeFlow,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);

    sendMessage(text, [...localMessages, userMsg], (assistantContent) => {
      if (!assistantContent) return;
      setLocalMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantContent,
          flow: activeFlow,
          created_at: new Date().toISOString(),
        },
      ]);
    });
  }

  function handleClear() {
    Alert.alert('Clear conversation?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory(activeFlow);
          setLocalMessages([]);
          useChatStore.getState().clearHistory(activeFlow);
        },
      },
    ]);
  }

  function handleShortcutSelect(flow: FlowMode, p: string) {
    setFlow(flow);
    setPrefill(p);
  }

  const displayItems: DisplayItem[] = [
    ...localMessages.map((msg, i) => ({
      kind: 'message' as const,
      msg,
      key: `msg-${i}-${msg.created_at}`,
    })),
    ...(isStreaming
      ? [
          streamingContent
            ? ({ kind: 'streaming', content: streamingContent, key: 'streaming' } as DisplayItem)
            : ({ kind: 'typing', key: 'typing' } as DisplayItem),
        ]
      : []),
  ];

  return (
    <SafeAreaView style={tabScreenStyles.safe}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline — chat is unavailable</Text>
        </View>
      )}
      <View style={[tabScreenStyles.header, tabScreenStyles.headerRow]}>
        <FlowPill flow={activeFlow} />
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading && !initialized ? (
          <View style={tabScreenStyles.centered}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={displayItems}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              if (item.kind === 'message') return <ChatBubble message={item.msg} />;
              if (item.kind === 'streaming')
                return (
                  <ChatBubble
                    message={{
                      role: 'assistant',
                      content: item.content,
                      flow: activeFlow,
                      created_at: '',
                    }}
                  />
                );
              return <TypingIndicator />;
            }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ShortcutBar
          activeFlow={activeFlow}
          enrollmentStatus={user?.enrollment_status}
          onShortcutSelect={handleShortcutSelect}
        />
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming || isOffline}
          prefill={prefill}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
