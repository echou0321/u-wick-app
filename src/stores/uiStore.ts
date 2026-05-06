import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UIStore {
  heatMapVisible: boolean;
  offlineMode: boolean;
  wizardStep: 0 | 1 | 2 | 3;
  wizardCompleted: boolean;
  toggleHeatMap: () => void;
  setOfflineMode: (v: boolean) => void;
  startWizard: () => void;
  advanceWizard: () => void;
  completeWizard: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      heatMapVisible: true,
      offlineMode: false,
      wizardStep: 0,
      wizardCompleted: false,
      toggleHeatMap: () => set((s) => ({ heatMapVisible: !s.heatMapVisible })),
      setOfflineMode: (v) => set({ offlineMode: v }),
      startWizard: () => set({ wizardStep: 1 }),
      advanceWizard: () =>
        set((s) => ({
          wizardStep: Math.min(s.wizardStep + 1, 3) as 0 | 1 | 2 | 3,
        })),
      completeWizard: () => set({ wizardCompleted: true, wizardStep: 0 }),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        heatMapVisible: state.heatMapVisible,
        wizardCompleted: state.wizardCompleted,
      }),
    },
  ),
);
