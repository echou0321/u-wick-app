import { Platform } from 'react-native';
import Constants from 'expo-constants';
import client from './client';
import type { FlowMode } from '../types/api';
import { useSessionStore } from '../stores/sessionStore';

let ensureSessionPromise: Promise<string | null> | null = null;

async function ensureSession(flow: FlowMode = 'free'): Promise<string | null> {
  const existing = useSessionStore.getState().sessionId;
  if (existing) return existing;

  if (ensureSessionPromise) return ensureSessionPromise;

  ensureSessionPromise = startSession(flow)
    .then((res) => res.session_id ?? null)
    .catch(() => null)
    .finally(() => {
      ensureSessionPromise = null;
    });

  return ensureSessionPromise;
}

export function startSession(flow: FlowMode = 'free') {
  return client
    .post<{ session_id: string; started_at: string }>('/sessions/start', {
      flow,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? '1.0.0',
    })
    .then((res) => {
      useSessionStore.getState().setSessionId(res.data.session_id);
      return res.data;
    });
}

/** Fire-and-forget analytics; never throws — callers may still `.catch()` for safety. */
export function logEvent(event: string, data?: Record<string, unknown>) {
  return ensureSession('free')
    .then((sessionId) => {
      if (!sessionId) return null;
      return client
        .post('/sessions/event', {
          session_id: sessionId,
          event_type: event,
          metadata: data ?? {},
        })
        .then((res) => res.data);
    })
    .catch(() => null);
}

export function endSession() {
  const sessionId = useSessionStore.getState().sessionId;
  if (!sessionId) return Promise.resolve(null);
  useSessionStore.getState().setSessionId(null);
  return client.post('/sessions/end', { session_id: sessionId }).then((res) => res.data);
}
