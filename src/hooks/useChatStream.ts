import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { logEvent } from '../api/sessions';
import type { ChatMessage, FlowMode } from '../types/api';

type SideEffectAction = { type: string; [key: string]: unknown };

function stripSideEffectBlocks(text: string): string {
  return text.replace(/<side_effects>[\s\S]*?<\/side_effects>/g, '').trim();
}

function getInvalidationKeys(actions: SideEffectAction[]): string[][] {
  const keys: string[][] = [];
  const seen = new Set<string>();

  function add(key: string) {
    if (!seen.has(key)) {
      seen.add(key);
      keys.push([key]);
    }
  }

  for (const action of actions) {
    switch (action.type) {
      case 'add_study_blocks':
        add('schedule');
        add('heat');
        break;
      case 'breakdown_task':
      case 'complete_task':
      case 'add_task':
        add('tasks');
        break;
      case 'update_checklist':
        add('goals');
        break;
      case 'set_notif_active':
        add('user');
        break;
    }
  }
  return keys;
}

export function useChatStream(flow: FlowMode) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const sendMessage = useCallback(
    async (
      text: string,
      conversationHistory: ChatMessage[],
      onFinalized: (content: string) => void,
    ) => {
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      const token = useAuthStore.getState().token;
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      const turnStart = Date.now();
      let accumulated = '';
      const pendingKeys: string[][] = [];
      let finalized = false;
      let buffer = '';

      function parseBuffer() {
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          try {
            const event = JSON.parse(raw) as {
              type: string;
              content?: string;
              actions?: SideEffectAction[];
            };

            if (event.type === 'token' && event.content) {
              accumulated += event.content;
            } else if (event.type === 'side_effects' && event.actions) {
              pendingKeys.push(...getInvalidationKeys(event.actions));
            } else if (event.type === 'done') {
              finalized = true;
              onFinalized(stripSideEffectBlocks(accumulated));
              for (const key of pendingKeys) {
                qc.invalidateQueries({ queryKey: key });
              }
              logEvent('chat_turn', {
                flow,
                message_length: text.length,
                response_time_ms: Date.now() - turnStart,
                side_effects_triggered: pendingKeys.length > 0,
              }).catch(() => {});
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${baseUrl}/chat`);
          xhr.setRequestHeader('Content-Type', 'application/json');
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.timeout = 60000;

          let processedLength = 0;

          xhr.onprogress = () => {
            const newChunk = xhr.responseText.slice(processedLength);
            processedLength = xhr.responseText.length;
            if (newChunk) {
              buffer += newChunk;
              parseBuffer();
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 400) {
              reject(new Error(`HTTP ${xhr.status}`));
              return;
            }
            // flush any remaining text the onprogress didn't catch
            const remaining = xhr.responseText.slice(processedLength);
            if (remaining) {
              buffer += remaining;
              parseBuffer();
            }
            if (!finalized && accumulated) {
              onFinalized(stripSideEffectBlocks(accumulated));
            }
            resolve();
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.ontimeout = () => reject(new Error('Request timed out'));

          xhr.send(
            JSON.stringify({ message: text, flow, conversationHistory }),
          );
        });
      } catch (err) {
        console.error('[useChatStream]', err);
        setError('Message failed. Try again.');
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [flow, qc],
  );

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error,
    clearError: () => setError(null),
  };
}
