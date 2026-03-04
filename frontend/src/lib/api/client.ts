const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }
  return url.toString()
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

function clearTokens(): void {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const response = await fetch(`${BASE_URL}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data = await response.json()
    setTokens(data.access, refresh)
    return data.access
  } catch {
    clearTokens()
    return null
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      response = await fetch(url, { ...options, headers })
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }

  return response
}

function extractErrorMessage(error: Record<string, unknown>): string {
  const detail = error.detail
  if (!detail) return `An error occurred`
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    // Django Ninja validation: [{ "msg": "...", "loc": [...] }, ...]
    const messages = detail.map((item: Record<string, unknown>) => {
      if (typeof item === "string") return item
      const loc = Array.isArray(item.loc) ? item.loc.slice(-1)[0] : ""
      return loc ? `${loc}: ${item.msg}` : String(item.msg || item)
    })
    return messages.join(", ")
  }
  return JSON.stringify(detail)
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }))
    throw new Error(extractErrorMessage(error))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(path, options?.params)
    const response = await fetchWithAuth(url, { method: "GET" })
    return handleResponse<T>(response)
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(path)
    const response = await fetchWithAuth(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(path)
    const response = await fetchWithAuth(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async delete<T = void>(path: string): Promise<T> {
    const url = buildUrl(path)
    const response = await fetchWithAuth(url, { method: "DELETE" })
    return handleResponse<T>(response)
  },
}

export { setTokens, clearTokens, getAccessToken, getRefreshToken }
