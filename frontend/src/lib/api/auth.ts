import { api } from "./client"
import type { User } from "@/types/api"

interface LoginResponse {
  access: string
  refresh: string
  user: User
}

interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterData) =>
    api.post<LoginResponse>("/auth/register", data),

  me: () =>
    api.get<User>("/auth/me"),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>("/auth/token/refresh", { refresh }),

  setupCheck: () =>
    api.get<{ needs_setup: boolean }>("/auth/setup-check"),

  setup: (data: {
    company_name: string
    first_name: string
    last_name: string
    email: string
    password: string
  }) =>
    api.post<{ access: string; refresh: string }>("/auth/setup", data),
}
