import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

interface AuthStore {
  token: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  userId: null,
  setAuth: (token, userId) => {
    set({ token, userId });
    SecureStore.setItemAsync('jwt', token);
  },
  clearAuth: () => {
    set({ token: null, userId: null });
    SecureStore.deleteItemAsync('jwt');
  },
  hydrate: async () => {
    const token = await SecureStore.getItemAsync('jwt');
    if (token) {
      try {
        const { id } = jwtDecode<{ id: string }>(token);
        set({ token, userId: id });
      } catch {
        SecureStore.deleteItemAsync('jwt');
      }
    }
  },
}));
