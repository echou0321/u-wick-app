import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  AppState,
  Task,
  ScheduleBlock,
  FlowMode,
} from '@/types';
import {
  MOCK_USER,
  MOCK_TASKS,
  TODAY_SCHEDULE,
} from '@/data/mock-state';

interface AppContextValue extends AppState {
  toggleTask: (id: string) => void;
  addStudyBlocks: (blocks: ScheduleBlock[]) => void;
  setNotifActive: (active: boolean) => void;
  dismissProactiveAlert: () => void;
  setDeadlineAdded: (added: boolean) => void;
  setActiveChatFlow: (flow: FlowMode) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [studyBlocks, setStudyBlocks] = useState<ScheduleBlock[]>([]);
  const [notifActive, setNotifActiveState] = useState(false);
  const [proactiveAlertDismissed, setProactiveAlertDismissed] = useState(false);
  const [deadlineAdded, setDeadlineAddedState] = useState(false);
  const [activeChatFlow, setActiveChatFlowState] = useState<FlowMode>('planning');

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const addStudyBlocks = useCallback((blocks: ScheduleBlock[]) => {
    setStudyBlocks((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      const newBlocks = blocks.filter((b) => !existingIds.has(b.id));
      return [...prev, ...newBlocks];
    });
  }, []);

  const setNotifActive = useCallback((active: boolean) => {
    setNotifActiveState(active);
  }, []);

  const dismissProactiveAlert = useCallback(() => {
    setProactiveAlertDismissed(true);
  }, []);

  const setDeadlineAdded = useCallback((added: boolean) => {
    setDeadlineAddedState(added);
  }, []);

  const setActiveChatFlow = useCallback((flow: FlowMode) => {
    setActiveChatFlowState(flow);
  }, []);

  const value: AppContextValue = {
    user: MOCK_USER,
    tasks,
    todaySchedule: TODAY_SCHEDULE,
    studyBlocks,
    notifActive,
    proactiveAlertDismissed,
    deadlineAdded,
    activeChatFlow,
    toggleTask,
    addStudyBlocks,
    setNotifActive,
    dismissProactiveAlert,
    setDeadlineAdded,
    setActiveChatFlow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
