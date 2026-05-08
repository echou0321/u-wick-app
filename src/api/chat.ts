import client from './client';
import type { ChatMessage, FlowMode } from '../types/api';

export function getChatHistory(flow: FlowMode) {
  return client.get<ChatMessage[]>('/chat/history', { params: { flow } });
}

export function deleteChatHistory(flow: FlowMode) {
  return client.delete('/chat/history', { params: { flow } });
}
