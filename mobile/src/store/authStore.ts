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
  refreshToken: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  setTokens: (token: string, refreshToken: string) => Promise<void>;
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

async function persistTokens(token: string, refreshToken: string) {
  if (isWeb) {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('refreshToken', refreshToken);
  } else {
    await AsyncStorage.multiSet([
      ['token', token],
      ['refreshToken', refreshToken],
    ]);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isHydrated: false,

  setAuth: async (user, token, refreshToken) => {
    await persistUser(user);
    await persistTokens(token, refreshToken);
    set({ user, token, refreshToken, isHydrated: true });
  },

  setTokens: async (token, refreshToken) => {
    await persistTokens(token, refreshToken);
    set({ token, refreshToken });
  },

  updateUser: async (user) => {
    await persistUser(user);
    set({ user });
  },

  logout: async () => {
    if (isWeb) {
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('refreshToken');
    } else {
      await AsyncStorage.multiRemove(['user', 'token', 'refreshToken']);
    }
    set({ user: null, token: null, refreshToken: null, isHydrated: true });
  },

  loadAuth: async () => {
    try {
      let userStr: string | null = null;
      let token: string | null = null;
      let refreshToken: string | null = null;

      if (isWeb) {
        userStr = window.localStorage.getItem('user');
        token = window.localStorage.getItem('token');
        refreshToken = window.localStorage.getItem('refreshToken');
      } else {
        const stored = await AsyncStorage.multiGet([
          'user',
          'token',
          'refreshToken',
        ]);
        userStr = stored[0][1];
        token = stored[1][1];
        refreshToken = stored[2][1];
      }

      if (userStr && token) {
        set({ user: JSON.parse(userStr), token, refreshToken });
      }
    } catch (error) {
      console.error('Failed to load auth', error);
    } finally {
      set({ isHydrated: true });
    }
  },
}));
