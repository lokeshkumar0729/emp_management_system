import { useState } from 'react'
import { Check, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { primaryButton } from '../ui/styles'

const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO !== 'false'
const DEMO = {
  admin: { email: 'admin@example.com', password: 'Admin@123' },
  employee: { email: 'emp1@example.com', password: 'Employee@123' },
}

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password, remember)
    } catch (err) {
      setError(err.fieldErrors?.email ?? err.message)
      setBusy(false)
    }
  }

  const fillDemo = (kind) => {
    setEmail(DEMO[kind].email)
    setPassword(DEMO[kind].password)
    setError('')
  }

  const field =
    'w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="font-semibold">Employee Management System</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">Every task has an owner and a due date.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Admins assign work and see what is overdue. Employees accept it, report progress and close it out.
          </p>
        </div>
        <p className="text-sm text-white/60">Spring Boot · MySQL · React</p>
      </aside>

      <main className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">Log in</h2>
          <p className="mt-1 text-sm text-slate-500">Use the account your administrator created for you.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Keep me logged in on this device
            </label>
            <button type="submit" disabled={busy || !email || !password} className={`${primaryButton} w-full py-2.5`}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          {SHOW_DEMO && (
            <div className="mt-8 rounded-lg border border-dashed border-line bg-canvas p-4 text-sm">
              <p className="font-medium">Try the demo</p>
              <p className="mt-1 text-slate-500">Fill in a demo account, then press Log in.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => fillDemo('admin')} className="rounded-lg border border-line bg-white px-3 py-1.5 font-medium hover:bg-slate-50">
                  Admin
                </button>
                <button type="button" onClick={() => fillDemo('employee')} className="rounded-lg border border-line bg-white px-3 py-1.5 font-medium hover:bg-slate-50">
                  Employee
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
