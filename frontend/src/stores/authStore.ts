import { create } from "zustand"
import { authApi } from "@/lib/api/auth"
import { setTokens, clearTokens } from "@/lib/api/client"
import type { User } from "@/types/api"

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setAuthTokens: (access: string, refresh: string) => void
  fetchUser: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setTokens(response.access, response.refresh)
    set({
      user: response.user,
      accessToken: response.access,
      refreshToken: response.refresh,
      isAuthenticated: true,
    })
  },

  logout: () => {
    clearTokens()
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  },

  setAuthTokens: (access: string, refresh: string) => {
    setTokens(access, refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  fetchUser: async () => {
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true })
    } catch {
      get().logout()
    }
  },

  initialize: () => {
    if (typeof window === "undefined") {
      set({ isLoading: false })
      return
    }

    const access = localStorage.getItem("access_token")
    const refresh = localStorage.getItem("refresh_token")

    if (access && refresh) {
      set({ accessToken: access, refreshToken: refresh })
      get().fetchUser().finally(() => {
        set({ isLoading: false })
      })
    } else {
      set({ isLoading: false })
    }
  },
}))
