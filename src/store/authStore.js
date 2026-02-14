import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        })
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
