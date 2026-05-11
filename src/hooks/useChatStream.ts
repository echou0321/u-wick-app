import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { logEvent } from '../api/sessions';
import type { ChatMessage, FlowMode } from '../types/api';

type SideEffectAction = { type: string; [key: string]: unknown };

const SIDE_EFFECT_RE = /<side_effects>([\s\S]*?)<\/side_effects>/g;

function stripSideEffectBlocks(text: string): string {
  return text.replace(SIDE_EFFECT_RE, '').trim();
}

// Parse all <side_effects>…</side_effects> XML blocks embedded in the streamed
// assistant text. The backend currently emits actions this way rather than as a
// separate SSE `side_effects` event, so we mine the token stream for them at
// the end of a turn and use them to invalidate React Query caches.
//
// Inner payload is best-effort JSON: a single action object, an array of
// actions, or { actions: [...] }. If parsing fails we still surface an
// `unknown_side_effect` marker so the caller can do a coarse invalidation
// rather than leaving the user staring at stale data.
function parseInlineSideEffects(text: string): SideEffectAction[] {
  const actions: SideEffectAction[] = [];
  for (const match of text.matchAll(SIDE_EFFECT_RE)) {
    const inner = match[1].trim();
    if (!inner) continue;
    try {
      const parsed = JSON.parse(inner);
      if (Array.isArray(parsed)) {
        for (const a of parsed) if (a && typeof a === 'object') actions.push(a);
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray((parsed as { actions?: unknown }).actions)) {
          for (const a of (parsed as { actions: unknown[] }).actions) {
            if (a && typeof a === 'object') actions.push(a as SideEffectAction);
          }
        } else if (typeof (parsed as { type?: unknown }).type === 'string') {
          actions.push(parsed as SideEffectAction);
        } else {
          actions.push({ type: 'unknown_side_effect' });
        }
      } else {
        actions.push({ type: 'unknown_side_effect' });
      }
    } catch {
      actions.push({ type: 'unknown_side_effect' });
    }
  }
  return actions;
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
      case 'update_block':
      case 'delete_block':
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
      case 'unknown_side_effect':
        // Coarse fallback: refresh everything the user might see change.
        add('schedule');
        add('heat');
        add('tasks');
        add('goals');
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
              setStreamingContent(stripSideEffectBlocks(accumulated));
            } else if (event.type === 'side_effects' && event.actions) {
              pendingKeys.push(...getInvalidationKeys(event.actions));
            } else if (event.type === 'done') {
              finalized = true;
              onFinalized(stripSideEffectBlocks(accumulated));

              // Combine SSE-channel actions with any inline <side_effects>
              // XML blocks the assistant embedded in its token stream.
              const inlineActions = parseInlineSideEffects(accumulated);
              const inlineKeys = getInvalidationKeys(inlineActions);
              const allKeys = [...pendingKeys, ...inlineKeys];
              const dedup = new Set<string>();
              for (const key of allKeys) {
                const sig = key.join('|');
                if (dedup.has(sig)) continue;
                dedup.add(sig);
                qc.invalidateQueries({ queryKey: key });
              }

              if (__DEV__ && (pendingKeys.length || inlineActions.length)) {
                // eslint-disable-next-line no-console
                console.log('[chat] invalidated', Array.from(dedup), {
                  sse: pendingKeys.length,
                  inline: inlineActions.length,
                });
              }

              logEvent('chat_turn', {
                flow,
                message_length: text.length,
                response_time_ms: Date.now() - turnStart,
                side_effects_triggered:
                  pendingKeys.length > 0 || inlineActions.length > 0,
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
              // Stream ended without a `done` event — still try to apply
              // any side effects we can mine from the token text.
              const fallbackActions = parseInlineSideEffects(accumulated);
              const fallbackKeys = getInvalidationKeys(fallbackActions);
              const dedup = new Set<string>();
              for (const key of [...pendingKeys, ...fallbackKeys]) {
                const sig = key.join('|');
                if (dedup.has(sig)) continue;
                dedup.add(sig);
                qc.invalidateQueries({ queryKey: key });
              }
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
