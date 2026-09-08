import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('radiogestao_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('radiogestao_token')
      localStorage.removeItem('radiogestao_user')
      window.location.href = '/login?sessao=expirada'
    }
    return Promise.reject(err)
  }
)

export default api
