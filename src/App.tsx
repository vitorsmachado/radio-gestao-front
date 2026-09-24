import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import AppLayout from './layouts/AppLayout'
import Login from './pages/login/Login'

// Clientes
import ClientesLista from './pages/clientes/ClientesLista'
import ClienteForm from './pages/clientes/ClienteForm'
import ClienteDetalhe from './pages/clientes/ClienteDetalhe'

// Ordens de Serviço
import OsLista from './pages/os/OsLista'
import OsForm from './pages/os/OsForm'
import OsDetalhe from './pages/os/OsDetalhe'

// Manutenção (técnico)
import FilaManutencao from './pages/manutencao/FilaManutencao'
import AvaliacaoOS from './pages/manutencao/AvaliacaoOS'

// Orçamentos
import OrcamentosLista from './pages/orcamentos/OrcamentosLista'
import OrcamentoDetalhe from './pages/orcamentos/OrcamentoDetalhe'

// Notificações
import NotificacoesLista from './pages/notificacoes/NotificacoesLista'

// Configurações
import Configuracoes from './pages/configuracoes/Configuracoes'

// Estoque
import PecasLista from './pages/estoque/PecasLista'
import CatalogoLista from './pages/estoque/CatalogoLista'

function AuthWrapper() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <AuthWrapper />,
    children: [
      { path: '/login', element: <Login /> },

      {
        element: <RotaProtegida />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/os', element: <OsLista /> },
              { path: '/os/novo', element: <OsForm /> },
              { path: '/os/:id', element: <OsDetalhe /> },
              { path: '/clientes', element: <ClientesLista /> },
              { path: '/clientes/novo', element: <ClienteForm /> },
              { path: '/clientes/:id/editar', element: <ClienteForm /> },
              { path: '/clientes/:id', element: <ClienteDetalhe /> },
              { path: '/estoque/pecas', element: <PecasLista /> },
              { path: '/estoque/catalogo', element: <CatalogoLista /> },
              { path: '/orcamentos', element: <OrcamentosLista /> },
              { path: '/orcamentos/:id', element: <OrcamentoDetalhe /> },
              { path: '/notificacoes', element: <NotificacoesLista /> },
              {
                element: <RotaProtegida roles={['TECNICO', 'ADMIN']} />,
                children: [
                  { path: '/manutencao', element: <FilaManutencao /> },
                  { path: '/manutencao/:osId', element: <AvaliacaoOS /> },
                ],
              },
              {
                element: <RotaProtegida roles={['ADMIN']} />,
                children: [
                  { path: '/configuracoes', element: <Configuracoes /> },
                ],
              },
              { path: '/', element: <Navigate to="/clientes" replace /> },
            ],
          },
        ],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
