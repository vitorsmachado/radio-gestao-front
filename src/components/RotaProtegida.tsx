import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import type { RoleUsuario } from '../types/auth'

interface Props {
  roles?: RoleUsuario[]
}

/**
 * Protege rotas que exigem autenticação.
 * Se roles for informado, só permite acesso para as roles listadas.
 */
export default function RotaProtegida({ roles }: Props) {
  const { usuario } = useAuthContext()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
