import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import type { RoleUsuario } from '../types/auth'
import './app-layout.css'

function getTokenExp(): number | null {
  const token = localStorage.getItem('radiogestao_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: RoleUsuario[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function AppLayout() {
  const { usuario, logout } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()
  const [avisoExpirando, setAvisoExpirando] = useState(false)

  useEffect(() => {
    const verificar = () => {
      const exp = getTokenExp()
      if (!exp) return
      const restante = exp - Date.now()
      if (restante <= 0) {
        localStorage.removeItem('radiogestao_token')
        localStorage.removeItem('radiogestao_user')
        window.location.href = '/login?sessao=expirada'
      } else {
        setAvisoExpirando(restante < 5 * 60 * 1000)
      }
    }
    verificar()
    const t = setInterval(verificar, 60_000)
    return () => clearInterval(t)
  }, [location.pathname])

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const nav: NavSection[] = [
    {
      title: 'Operações',
      items: [
        {
          label: 'Ordens de Serviço',
          path: '/os',
          roles: ['ADMIN', 'TECNICO', 'AUXILIAR'],
          icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 2h7l3 3v9H3z" />
              <path d="M10 2v3h3" />
              <line x1="5" y1="7" x2="11" y2="7" />
              <line x1="5" y1="10" x2="8" y2="10" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Comercial',
      items: [
        {
          label: 'Clientes',
          path: '/clientes',
          roles: ['ADMIN', 'AUXILIAR'],
          icon: (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3" />
              <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
          ),
        },
      ],
    },
  ]

  const canSee = (item: NavItem) =>
    !item.roles || item.roles.includes(usuario?.role as RoleUsuario)

  const initials = usuario?.nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-text">RADIOGESTÃO</div>
          <div className="logo-sub">// gestão integrada</div>
        </div>

        {nav.map(section => {
          const visibleItems = section.items.filter(canSee)
          if (visibleItems.length === 0) return null
          return (
            <div key={section.title}>
              <div className="nav-section">{section.title}</div>
              {visibleItems.map(item => (
                <div
                  key={item.path}
                  className={`nav-item${isActive(item.path) ? ' active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          )
        })}

        <div className="sidebar-footer">
          <div className="user-row">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{usuario?.nome}</div>
              <div className="user-role">{usuario?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Sair"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'flex' }}
            >
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 8H2M6 4l-4 4 4 4" />
                <path d="M6 2h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {avisoExpirando && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'color-mix(in srgb, var(--amber) 14%, var(--bg2))',
            borderBottom: '1px solid color-mix(in srgb, var(--amber) 40%, transparent)',
            padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--amber)', fontFamily: 'var(--mono)', flexShrink: 0 }}>⚠</span>
            <span style={{ color: 'var(--text2)', flex: 1 }}>
              Sua sessão expira em menos de 5 minutos. Salve o que estiver fazendo e faça login novamente.
            </span>
            <button
              onClick={() => { logout(); navigate('/login') }}
              style={{
                background: 'none', border: '1px solid var(--amber)', borderRadius: 4,
                color: 'var(--amber)', cursor: 'pointer', padding: '3px 10px',
                fontSize: 12, fontFamily: 'var(--mono)', flexShrink: 0,
              }}
            >
              Fazer login
            </button>
            <button
              onClick={() => setAvisoExpirando(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: '0 4px', flexShrink: 0 }}
            >✕</button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
