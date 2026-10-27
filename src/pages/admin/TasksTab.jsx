import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import { useToast } from '../../context/toast-context'
import { useDebounce } from '../../hooks/useDebounce'
import { useQuery } from '../../hooks/useQuery'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../lib/constants'
import { formatDate } from '../../lib/format'
import { PriorityBadge, StatusBadge } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorNotice from '../../components/ui/ErrorNotice'
import Pagination from '../../components/ui/Pagination'
import ProgressBar from '../../components/ui/ProgressBar'
import { inputClass, primaryButton } from '../../components/ui/styles'
import TaskFormModal from './TaskFormModal'

const PAGE_SIZE = 10

export default function TasksTab({ defaultOverdue = false }) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const q = useDebounce(search)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [overdue, setOverdue] = useState(defaultOverdue)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null) // 'new' | task | null
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const employees = useQuery(() => api.employees.options(), [])
  const tasks = useQuery(
    () => api.tasks.list({ q, status, priority, assigneeId, overdue, page, size: PAGE_SIZE }),
    [q, status, priority, assigneeId, overdue, page],
  )

  const onFilter = (setter) => (e) => {
    setter(e.target.value)
    setPage(0)
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await api.tasks.remove(deleting.id)
      toast.success('Task deleted')
      setDeleting(null)
      if (tasks.data.content.length === 1 && page > 0) setPage(page - 1)
      else tasks.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const rows = tasks.data?.content ?? []
  const filtersActive = Boolean(q || status || priority || assigneeId || overdue)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search tasks"
            className={`${inputClass} pl-9`}
            placeholder="Search title, description or category"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <select aria-label="Filter by status" className={`${inputClass} w-auto`} value={status} onChange={onFilter(setStatus)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select aria-label="Filter by priority" className={`${inputClass} w-auto`} value={priority} onChange={onFilter(setPriority)}>
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select aria-label="Filter by employee" className={`${inputClass} w-auto`} value={assigneeId} onChange={onFilter(setAssigneeId)}>
          <option value="">All employees</option>
          {(employees.data ?? []).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={overdue}
            onChange={(e) => {
              setOverdue(e.target.checked)
              setPage(0)
            }}
          />
          Overdue only
        </label>
        <button className={primaryButton} onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New task
        </button>
      </div>

      {tasks.error && <ErrorNotice error={tasks.error} onRetry={tasks.reload} />}

      {!tasks.error && (
        <div className="overflow-hidden rounded-xl border border-line bg-white" aria-busy={tasks.loading}>
          {tasks.data && rows.length === 0 ? (
            <EmptyState title={filtersActive ? 'No tasks match these filters' : 'No tasks yet'}>
              {filtersActive ? 'Try clearing a filter or searching for something else.' : 'Create the first task and assign it to an employee.'}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[56rem] text-left text-sm ${tasks.loading ? 'opacity-60' : ''}`}>
                <thead className="border-b border-line bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Task</th>
                    <th className="px-4 py-3 font-semibold">Assignee</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Due</th>
                    <th className="px-4 py-3 font-semibold">Progress</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((t) => {
                    const closed = !['PENDING', 'IN_PROGRESS'].includes(t.status)
                    return (
                      <tr key={t.id}>
                        <td className="max-w-64 px-4 py-3">
                          <p className="truncate font-medium">{t.title}</p>
                          {t.category && <p className="truncate text-xs text-slate-500">{t.category}</p>}
                        </td>
                        <td className="px-4 py-3">{t.assigneeName}</td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(t.dueDate)}
                          {t.overdue && <span className="ml-2 text-xs font-semibold text-red-600">Overdue</span>}
                        </td>
                        <td className="px-4 py-3">
                          <ProgressBar value={t.percentComplete} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              aria-label={`Edit ${t.title}`}
                              title={closed ? 'Closed tasks cannot be edited' : 'Edit'}
                              disabled={closed}
                              onClick={() => setEditing(t)}
                              className="rounded p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              aria-label={`Delete ${t.title}`}
                              title="Delete"
                              onClick={() => setDeleting(t)}
                              className="rounded p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tasks.data && (
        <Pagination page={tasks.data.page} totalPages={tasks.data.totalPages} totalElements={tasks.data.totalElements} size={PAGE_SIZE} onPage={setPage} />
      )}

      {editing && (
        <TaskFormModal
          task={editing === 'new' ? null : editing}
          employees={employees.data}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            tasks.reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this task?"
          message={`“${deleting.title}” will be removed permanently for ${deleting.assigneeName}.`}
          confirmLabel="Delete task"
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
