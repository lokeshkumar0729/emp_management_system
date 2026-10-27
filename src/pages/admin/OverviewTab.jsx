import { api } from '../../api/client'
import { useQuery } from '../../hooks/useQuery'
import { STATUS_META } from '../../lib/constants'
import { daysOverdue, formatDate } from '../../lib/format'
import { PriorityBadge } from '../../components/ui/Badges'
import EmptyState from '../../components/ui/EmptyState'
import ErrorNotice from '../../components/ui/ErrorNotice'
import { secondaryButton } from '../../components/ui/styles'

const STATUS_ORDER = [
  ['COMPLETED', 'completed'],
  ['IN_PROGRESS', 'inProgress'],
  ['PENDING', 'pending'],
  ['FAILED', 'failed'],
  ['DECLINED', 'declined'],
]

function Stat({ label, value, tone = '' }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${tone}`}>{value ?? '–'}</p>
    </div>
  )
}

export default function OverviewTab({ onOpenOverdue }) {
  const stats = useQuery(() => api.stats.overview(), [])
  const overdue = useQuery(() => api.tasks.list({ overdue: true, size: 5 }), [])

  if (stats.error) return <ErrorNotice error={stats.error} onRetry={stats.reload} />

  const counts = stats.data?.tasks
  const open = counts ? counts.pending + counts.inProgress : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open tasks" value={open} />
        <Stat label="Completed" value={counts?.completed} />
        <Stat label="Overdue" value={stats.data?.overdue} tone={stats.data?.overdue ? 'text-red-600' : ''} />
        <Stat label="Employees" value={stats.data?.employees} />
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="font-semibold">Tasks by status</h2>
        {counts && counts.total > 0 ? (
          <>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Share of tasks by status">
              {STATUS_ORDER.map(([status, key]) =>
                counts[key] > 0 ? (
                  <div key={status} className={STATUS_META[status].bar} style={{ width: `${(counts[key] / counts.total) * 100}%` }} />
                ) : null,
              )}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              {STATUS_ORDER.map(([status, key]) => (
                <li key={status} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[status].bar}`} />
                  <span className="text-slate-600">{STATUS_META[status].label}</span>
                  <span className="ml-auto font-semibold tabular-nums">{counts[key]}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No tasks yet. Create one from the Tasks tab.</p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Overdue tasks</h2>
          {overdue.data?.totalElements > 5 && (
            <button className={secondaryButton} onClick={onOpenOverdue}>
              See all {overdue.data.totalElements}
            </button>
          )}
        </div>
        {overdue.error ? (
          <div className="px-5 pb-5">
            <ErrorNotice error={overdue.error} onRetry={overdue.reload} />
          </div>
        ) : overdue.data && overdue.data.content.length === 0 ? (
          <EmptyState title="Nothing is overdue">Open tasks past their due date will show up here.</EmptyState>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {(overdue.data?.content ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-slate-500">{t.assigneeName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <PriorityBadge priority={t.priority} />
                  <span className="font-medium text-red-600">
                    {daysOverdue(t.dueDate)} {daysOverdue(t.dueDate) === 1 ? 'day' : 'days'} late
                  </span>
                  <span className="hidden text-slate-500 sm:inline">due {formatDate(t.dueDate)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
