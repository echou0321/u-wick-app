import { Platform } from 'react-native';
import Constants from 'expo-constants';
import client from './client';
import type { FlowMode } from '../types/api';

export function startSession(flow: FlowMode = 'free') {
  return client.post('/sessions/start', {
    flow,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? '1.0.0',
  }).then((res) => res.data);
}

export function logEvent(event: string, data?: Record<string, unknown>) {
  return client.post('/sessions/event', { event, data }).then((res) => res.data);
}

export function endSession() {
  return client.post('/sessions/end').then((res) => res.data);
}
