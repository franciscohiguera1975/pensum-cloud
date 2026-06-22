import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    tenantId: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      isAuthenticated: false,

      login: ({ accessToken, refreshToken, user, tenantId }) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tenantId', tenantId);
        set({ user, accessToken, refreshToken, tenantId, isAuthenticated: true });
      },

      logout: () => {
        localStorage.clear();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tenantId: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      // On page reload Zustand restores its own state from localStorage,
      // but raw keys (tenantId, accessToken, refreshToken) that the axios
      // interceptor reads are NOT automatically restored.
      // onRehydrateStorage re-syncs them after Zustand rehydrates.
      onRehydrateStorage: () => (state) => {
        if (state?.tenantId) localStorage.setItem('tenantId', state.tenantId);
        if (state?.accessToken) localStorage.setItem('accessToken', state.accessToken);
        if (state?.refreshToken) localStorage.setItem('refreshToken', state.refreshToken);
      },
    },
  ),
);
