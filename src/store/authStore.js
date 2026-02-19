import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.login(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.register(userData);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      logout: () => {
        api.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('pp_token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return;
        }
        try {
          const data = await api.getMe();
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch {
          // Token is invalid or user no longer exists — clear everything
          api.logout();
          localStorage.removeItem('pp-auth'); // Clear stale zustand persisted state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      clearError: () => set({ error: null }),

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      }
    }),
    {
      name: 'pp-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
