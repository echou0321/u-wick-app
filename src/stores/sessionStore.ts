import { create } from 'zustand';

interface SessionStore {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  setSessionId: (sessionId) => set({ sessionId }),
}));
