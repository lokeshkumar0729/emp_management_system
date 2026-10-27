import { useState } from 'react'
import { Search, TriangleAlert } from 'lucide-react'
import { api } from '../api/client'
import { useDebounce } from '../hooks/useDebounce'
import { useQuery } from '../hooks/useQuery'
import { STATUS_OPTIONS } from '../lib/constants'
import AppHeader from '../components/layout/AppHeader'
import EmptyState from '../components/ui/EmptyState'
import ErrorNotice from '../components/ui/ErrorNotice'
import Pagination from '../components/ui/Pagination'
import { inputClass } from '../components/ui/styles'
import TaskCard from './employee/TaskCard'

const PAGE_SIZE = 6

const COUNT_KEY = {
  '': 'total',
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DECLINED: 'declined',
}

const FILTERS = [{ value: '', label: 'All' }, ...STATUS_OPTIONS]

export default function EmployeeDashboard() {
  const [search, setSearch] = useState('')
  const q = useDebounce(search)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)

  const stats = useQuery(() => api.stats.mine(), [])
  const tasks = useQuery(() => api.tasks.mine({ q, status, page, size: PAGE_SIZE }), [q, status, page])

  const refresh = () => {
    stats.reload()
    tasks.reload()
  }

  const rows = tasks.data?.content ?? []
  const overdue = stats.data?.overdue ?? 0

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">My tasks</h1>

        {overdue > 0 && (
          <p role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            You have {overdue} overdue {overdue === 1 ? 'task' : 'tasks'}.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search my tasks"
              className={`${inputClass} pl-9`}
              placeholder="Search my tasks"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>

        <div role="group" aria-label="Filter by status" className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = status === f.value
            const count = stats.data?.tasks?.[COUNT_KEY[f.value]]
            return (
              <button
                key={f.value}
                aria-pressed={active}
                onClick={() => {
                  setStatus(f.value)
                  setPage(0)
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {count !== undefined && <span className={`ml-1.5 tabular-nums ${active ? 'text-white/80' : 'text-slate-500'}`}>{count}</span>}
              </button>
            )
          })}
        </div>

        <div className="mt-5" aria-busy={tasks.loading}>
          {tasks.error && <ErrorNotice error={tasks.error} onRetry={tasks.reload} />}

          {!tasks.error && tasks.data && rows.length === 0 && (
            <div className="rounded-xl border border-line bg-white">
              <EmptyState title={q || status ? 'No tasks match these filters' : 'No tasks assigned to you yet'}>
                {q || status ? 'Try another status or a different search.' : 'When your administrator assigns you work, it will show up here.'}
              </EmptyState>
            </div>
          )}

          {rows.length > 0 && (
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${tasks.loading ? 'opacity-60' : ''}`}>
              {rows.map((task) => (
                <TaskCard key={`${task.id}-${task.status}-${task.percentComplete}`} task={task} onChanged={refresh} />
              ))}
            </div>
          )}
        </div>

        {tasks.data && (
          <Pagination page={tasks.data.page} totalPages={tasks.data.totalPages} totalElements={tasks.data.totalElements} size={PAGE_SIZE} onPage={setPage} />
        )}
      </main>
    </div>
  )
}
