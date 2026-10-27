import { Check, LogOut } from 'lucide-react'
import { useAuth } from '../../context/auth-context'

export default function AppHeader({ children }) {
  const { user, logout } = useAuth()
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="font-semibold">Employee Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm leading-tight">
            <p className="font-semibold">{user.name}</p>
            <p className="text-slate-500">{user.role === 'ADMIN' ? 'Administrator' : user.department ?? 'Employee'}</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
      {children}
    </header>
  )
}
