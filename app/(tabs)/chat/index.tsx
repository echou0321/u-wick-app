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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { tabScreenStyles } from '@/src/styles/tabs';
import { chatScreenStyles as styles, flowTabStyles } from '@/src/styles/chat';
import { useChatHistory, useClearChatHistory } from '@/src/hooks/useChatHistory';
import { useChatStream } from '@/src/hooks/useChatStream';
import { useUser } from '@/src/hooks/useUser';
import { useChatStore } from '@/src/stores/chatStore';
import { useUIStore } from '@/src/stores/uiStore';
import { ChatBubble } from '@/src/components/chat/ChatBubble';
import { ChatInput } from '@/src/components/chat/ChatInput';
import { TypingIndicator } from '@/src/components/chat/TypingIndicator';
import { ShortcutBar } from '@/src/components/chat/ShortcutBar';
import { ChatAtAGlance } from '@/src/components/chat/ChatAtAGlance';
import { startSession } from '@/src/api/sessions';
import type { ChatMessage, FlowMode } from '@/src/types/api';

type DisplayItem =
  | { kind: 'message'; msg: ChatMessage; key: string }
  | { kind: 'streaming'; content: string; key: string }
  | { kind: 'typing'; key: string };

interface FlowTab {
  flow: FlowMode;
  label: string;
  color: string;
}

const ALL_TABS: FlowTab[] = [
  { flow: 'free', label: 'Chat', color: Colors.primary },
  { flow: 'planning', label: 'Planning', color: Colors.accentTeal },
  { flow: 'quarter_planning', label: 'Quarter plan', color: Colors.accentOrange },
  { flow: 'advising', label: 'Advising', color: Colors.accentYellow },
];

/** Flows that show the at-a-glance empty state (same dashboard UI on each). */
const GLANCE_FLOWS: FlowMode[] = ['free', 'planning', 'quarter_planning', 'advising'];

export default function ChatScreen() {
  const qc = useQueryClient();
  const { activeFlow, setFlow } = useChatStore();
  const { data: historyData, isLoading } = useChatHistory(activeFlow);
  const { sendMessage, isStreaming, streamingContent, error, clearError } =
    useChatStream(activeFlow);
  const { mutateAsync: clearHistory } = useClearChatHistory();
  const { data: user } = useUser();
  const isOffline = useUIStore((s) => s.offlineMode);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [messagesByFlow, setMessagesByFlow] = useState<Partial<Record<FlowMode, ChatMessage[]>>>(
    {},
  );
  const messagesByFlowRef = useRef(messagesByFlow);
  messagesByFlowRef.current = messagesByFlow;
  const [initialized, setInitialized] = useState(false);
  const [prefill, setPrefill] = useState('');
  const listRef = useRef<FlatList>(null);
  const sessionStarted = useRef(false);
  /** Per-flow: hidden while typing; shown again when switching tabs or revisiting Chat. */
  const [glanceHiddenByFlow, setGlanceHiddenByFlow] = useState<Partial<Record<FlowMode, boolean>>>(
    {},
  );

  const revealGlance = useCallback(() => {
    if (!GLANCE_FLOWS.includes(activeFlow)) return;
    setGlanceHiddenByFlow((prev) => ({ ...prev, [activeFlow]: false }));
  }, [activeFlow]);

  const dismissGlance = useCallback(() => {
    if (!GLANCE_FLOWS.includes(activeFlow)) return;
    setGlanceHiddenByFlow((prev) => ({ ...prev, [activeFlow]: true }));
  }, [activeFlow]);

  const visibleTabs = ALL_TABS.filter(
    (t) => !(t.flow === 'advising' && user?.enrollment_status === 'in-major'),
  );

  // Switching flow tabs: restore cached messages (keep history) and show at-a-glance again
  useEffect(() => {
    if (GLANCE_FLOWS.includes(activeFlow)) {
      setGlanceHiddenByFlow((prev) => ({ ...prev, [activeFlow]: false }));
    }

    const cached = messagesByFlowRef.current[activeFlow];
    if (cached !== undefined) {
      setLocalMessages(cached);
      setInitialized(true);
    } else {
      setLocalMessages([]);
      setInitialized(false);
    }
  }, [activeFlow]);

  // First visit to a flow: load server history into cache
  useEffect(() => {
    if (messagesByFlowRef.current[activeFlow] !== undefined) return;
    if (!initialized && historyData !== undefined) {
      setLocalMessages(historyData);
      setMessagesByFlow((prev) => ({ ...prev, [activeFlow]: historyData }));
      setInitialized(true);
    }
  }, [historyData, initialized, activeFlow]);

  // Keep per-flow cache in sync while user chats
  useEffect(() => {
    if (!initialized) return;
    setMessagesByFlow((prev) => ({ ...prev, [activeFlow]: localMessages }));
  }, [localMessages, activeFlow, initialized]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages.length, isStreaming, streamingContent, scrollToBottom]);

  function handleSend(text: string) {
    dismissGlance();
    clearError();
    setPrefill('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      flow: activeFlow,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);

    if (!sessionStarted.current) {
      sessionStarted.current = true;
      startSession(activeFlow).catch(() => {});
    }

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
          setMessagesByFlow((prev) => ({ ...prev, [activeFlow]: [] }));
          useChatStore.getState().clearHistory(activeFlow);
          revealGlance();
        },
      },
    ]);
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

  const activeTab = visibleTabs.find((t) => t.flow === activeFlow) ?? visibleTabs[0];

  const showAtAGlance =
    GLANCE_FLOWS.includes(activeFlow) &&
    !glanceHiddenByFlow[activeFlow] &&
    !isStreaming &&
    initialized;

  const displayName = user?.display_name ?? 'there';

  useFocusEffect(
    useCallback(() => {
      if (GLANCE_FLOWS.includes(activeFlow)) {
        setGlanceHiddenByFlow((prev) => ({ ...prev, [activeFlow]: false }));
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        qc.invalidateQueries({ queryKey: ['tasks'] });
      }
    }, [activeFlow, qc]),
  );

  return (
    <SafeAreaView style={tabScreenStyles.safe} edges={['top']}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline — chat is unavailable</Text>
        </View>
      )}

      {/* Flow tab strip */}
      <View style={flowTabStyles.row}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={flowTabStyles.scroll}
          contentContainerStyle={flowTabStyles.scrollContent}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeFlow === tab.flow;
            return (
              <TouchableOpacity
                key={tab.flow}
                style={[
                  flowTabStyles.tab,
                  isActive && { borderBottomColor: tab.color },
                ]}
                onPress={() => setFlow(tab.flow)}
                activeOpacity={0.7}
              >
                <View style={[flowTabStyles.dot, { backgroundColor: tab.color }]} />
                <Text
                  style={[
                    flowTabStyles.label,
                    isActive && flowTabStyles.labelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={flowTabStyles.clearBtn}
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading && !initialized ? (
          <View style={tabScreenStyles.centered}>
            <ActivityIndicator color={activeTab.color} />
          </View>
        ) : (
          <View style={styles.messageArea}>
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
              onContentSizeChange={() => {
                if (!showAtAGlance) {
                  listRef.current?.scrollToEnd({ animated: false });
                }
              }}
              onLayout={() => {
                if (!showAtAGlance) {
                  listRef.current?.scrollToEnd({ animated: false });
                }
              }}
            />
            {showAtAGlance ? (
              <ScrollView
                style={styles.glanceOverlay}
                contentContainerStyle={styles.messageList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <ChatAtAGlance displayName={displayName} />
              </ScrollView>
            ) : null}
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ShortcutBar
          activeFlow={activeFlow}
          onPrefill={(text) => {
            setPrefill(text);
            dismissGlance();
          }}
        />
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming || isOffline}
          prefill={prefill}
          onInputActivity={dismissGlance}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
