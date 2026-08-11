import { apiRequest, setAccessToken } from './client'
import type { AuthResponse, User, RegisterStudentRequest } from '@shared/types'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  await setAccessToken(data.accessToken)
  return data
}

export async function registerStudent(payload: RegisterStudentRequest): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
  })
  await setAccessToken(data.accessToken)
  return data
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST', body: {} })
  } finally {
    await setAccessToken(null)
  }
}

export async function fetchMe(): Promise<User> {
  return apiRequest<User>('/api/auth/me')
}

export async function updateProfile(payload: { full_name: string; phone?: string; country_id?: string }): Promise<User> {
  return apiRequest<User>('/api/auth/profile', { method: 'PATCH', body: payload })
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  await apiRequest('/api/auth/change-password', { method: 'POST', body: { current_password, new_password } })
}
