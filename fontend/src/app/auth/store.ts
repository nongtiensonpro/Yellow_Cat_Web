import { create } from 'zustand';
import keycloak from './keycloak';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isInitialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (isAuthenticated: boolean, user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isInitialized: false,
  login: async () => {
    try {
      await keycloak.login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  },
  logout: async () => {
    try {
      await keycloak.logout();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
  setAuth: (isAuthenticated: boolean, user: any) => {
    set({ isAuthenticated, user, isInitialized: true });
  }
}));