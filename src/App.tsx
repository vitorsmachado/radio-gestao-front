import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import AppLayout from './layouts/AppLayout'
import Login from './pages/login/Login'

// Clientes
import ClientesLista from './pages/clientes/ClientesLista'

// Ordens de Serviço
import OsLista from './pages/os/OsLista'

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
              { path: '/clientes', element: <ClientesLista /> },
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
