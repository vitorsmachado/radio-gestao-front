import api from './axios'
import type { LoginRequest, LoginResponse } from '../types/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/v1/auth/login', data).then(r => r.data),
}
