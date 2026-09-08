export type RoleUsuario = 'ADMIN' | 'TECNICO' | 'AUXILIAR'

export interface LoginRequest {
  login: string
  senha: string
}

export interface LoginResponse {
  token: string
  tipo: string
  usuarioId: string
  nome: string
  login: string
  role: RoleUsuario
}

// Dados do usuário logado salvos no localStorage
export interface UsuarioLogado {
  id: string
  nome: string
  login: string
  role: RoleUsuario
}
