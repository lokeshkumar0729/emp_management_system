import { useState } from 'react'
import AppHeader from '../components/layout/AppHeader'
import EmployeesTab from './admin/EmployeesTab'
import OverviewTab from './admin/OverviewTab'
import TasksTab from './admin/TasksTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'employees', label: 'Employees' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const select = (id) => {
    setOverdueOnly(false)
    setTab(id)
  }
  const openOverdue = () => {
    setOverdueOnly(true)
    setTab('tasks')
  }

  return (
    <div className="min-h-screen">
      <AppHeader>
        <div className="mx-auto max-w-6xl px-4">
          <div role="tablist" aria-label="Sections" className="-mb-px flex gap-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => select(t.id)}
                className={`border-b-2 px-1 py-3 text-sm font-semibold transition ${
                  tab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </AppHeader>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'overview' && <OverviewTab onOpenOverdue={openOverdue} />}
        {tab === 'tasks' && <TasksTab key={String(overdueOnly)} defaultOverdue={overdueOnly} />}
        {tab === 'employees' && <EmployeesTab />}
      </main>
    </div>
  )
}
