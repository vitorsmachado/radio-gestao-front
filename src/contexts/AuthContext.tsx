import { createContext, useContext, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { LoginRequest, UsuarioLogado } from '../types/auth'

const TOKEN_KEY = 'radiogestao_token'
const USER_KEY = 'radiogestao_user'

interface AuthContextValue {
  usuario: UsuarioLogado | null
  login: (dados: LoginRequest) => Promise<UsuarioLogado>
  logout: () => void
  isAdmin: boolean
  isTecnico: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getUsuarioSalvo(): UsuarioLogado | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(getUsuarioSalvo)

  const login = async (dados: LoginRequest): Promise<UsuarioLogado> => {
    const res = await authApi.login(dados)
    localStorage.setItem(TOKEN_KEY, res.token)
    const user: UsuarioLogado = {
      id: res.usuarioId,
      nome: res.nome,
      login: res.login,
      role: res.role,
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUsuario(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      login,
      logout,
      isAdmin: usuario?.role === 'ADMIN',
      isTecnico: usuario?.role === 'TECNICO',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de AuthProvider')
  return ctx
}
