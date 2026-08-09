import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const isWeb = typeof window !== 'undefined' && Boolean(window.localStorage);

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

async function persistUser(user: User) {
  if (isWeb) {
    window.localStorage.setItem('user', JSON.stringify(user));
  } else {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: async (user, token) => {
    await persistUser(user);
    if (isWeb) {
      window.localStorage.setItem('token', token);
    } else {
      await AsyncStorage.setItem('token', token);
    }
    set({ user, token, isHydrated: true });
  },

  updateUser: async (user) => {
    await persistUser(user);
    set({ user });
  },

  logout: async () => {
    if (isWeb) {
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('token');
    } else {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    }
    set({ user: null, token: null, isHydrated: true });
  },

  loadAuth: async () => {
    try {
      let userStr: string | null = null;
      let token: string | null = null;

      if (isWeb) {
        userStr = window.localStorage.getItem('user');
        token = window.localStorage.getItem('token');
      } else {
        userStr = await AsyncStorage.getItem('user');
        token = await AsyncStorage.getItem('token');
      }

      if (userStr && token) {
        set({ user: JSON.parse(userStr), token });
      }
    } catch (error) {
      console.error('Failed to load auth', error);
    } finally {
      set({ isHydrated: true });
    }
  },
}));
