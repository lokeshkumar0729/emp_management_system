import Login from './components/Auth/Login'
import { useAuth } from './context/auth-context'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    )
  }
  if (!user) return <Login />
  return user.role === 'ADMIN' ? <AdminDashboard /> : <EmployeeDashboard />
}
