import { create } from 'zustand';
import type { FlowMode, ChatMessage } from '../types/api';

interface ChatStore {
  activeFlow: FlowMode;
  histories: Record<FlowMode, ChatMessage[]>;
  setFlow: (flow: FlowMode) => void;
  appendMessage: (flow: FlowMode, message: ChatMessage) => void;
  clearHistory: (flow: FlowMode) => void;
}

const emptyHistories: Record<FlowMode, ChatMessage[]> = {
  planning: [],
  proactive: [],
  advising: [],
  quarter_planning: [],
  free: [],
};

export const useChatStore = create<ChatStore>((set) => ({
  activeFlow: 'free',
  histories: { ...emptyHistories },
  setFlow: (flow) => set({ activeFlow: flow }),
  appendMessage: (flow, message) =>
    set((state) => ({
      histories: {
        ...state.histories,
        [flow]: [...state.histories[flow], message],
      },
    })),
  clearHistory: (flow) =>
    set((state) => ({
      histories: { ...state.histories, [flow]: [] },
    })),
}));
