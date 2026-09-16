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
