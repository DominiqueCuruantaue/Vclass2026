import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import type { ApiResponse } from '@shared/types'

const ACCESS_TOKEN_KEY = 'vclass_access_token'

// Base URL: EXPO_PUBLIC_API_URL (build-time env) > app.json extra.apiBaseUrl > fallback local.
// Em dispositivo físico/emulador, "localhost" não aponta para a máquina de desenvolvimento —
// define EXPO_PUBLIC_API_URL=http://<ip-da-tua-máquina>:3000 num ficheiro .env (ver .env.example).
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as any)?.apiBaseUrl ||
  'http://localhost:3000'

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export async function loadStoredToken(): Promise<string | null> {
  accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  return accessToken
}

export async function setAccessToken(token: string | null) {
  accessToken = token
  if (token) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
}

export function getAccessToken() {
  return accessToken
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean // default true
  headers?: Record<string, string>
  isFormData?: boolean
}

// Tenta renovar o access token usando o refresh token guardado como cookie
// HttpOnly pelo backend — o stack de rede nativo do RN (iOS/Android) mantém
// automaticamente o cookie jar entre pedidos ao mesmo host, tal como um browser.
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        const json = (await res.json()) as ApiResponse<{ accessToken: string }>
        if (!res.ok || !json.success || !json.data) {
          await setAccessToken(null)
          return null
        }
        await setAccessToken(json.data.accessToken)
        return json.data.accessToken
      } catch {
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

export async function apiRequest<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {}, isFormData = false } = opts

  const doFetch = async (token: string | null) => {
    const finalHeaders: Record<string, string> = { ...headers }
    if (!isFormData) finalHeaders['Content-Type'] = 'application/json'
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: finalHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    })
  }

  let res = await doFetch(accessToken)

  // Access token expirado — tenta renovar uma vez e repete o pedido.
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken()
    if (newToken) res = await doFetch(newToken)
  }

  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new ApiError('Resposta inválida do servidor', res.status)
  }

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || 'Erro desconhecido', res.status)
  }
  return json.data as T
}

export async function apiUpload<T = any>(path: string, form: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  return apiRequest<T>(path, { method, body: form, isFormData: true })
}
