import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import { useToast } from '../../context/toast-context'
import { useDebounce } from '../../hooks/useDebounce'
import { useQuery } from '../../hooks/useQuery'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorNotice from '../../components/ui/ErrorNotice'
import Pagination from '../../components/ui/Pagination'
import { inputClass, primaryButton } from '../../components/ui/styles'
import EmployeeFormModal from './EmployeeFormModal'

const PAGE_SIZE = 10

export default function EmployeesTab() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const q = useDebounce(search)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null) // 'new' | employee | null
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const employees = useQuery(() => api.employees.list({ q, page, size: PAGE_SIZE }), [q, page])

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await api.employees.remove(deleting.id)
      toast.success(`${deleting.name} was removed`)
      setDeleting(null)
      if (employees.data.content.length === 1 && page > 0) setPage(page - 1)
      else employees.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const rows = employees.data?.content ?? []

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search employees"
            className={`${inputClass} pl-9`}
            placeholder="Search by name, email or department"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <button className={primaryButton} onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add employee
        </button>
      </div>

      {employees.error && <ErrorNotice error={employees.error} onRetry={employees.reload} />}

      {!employees.error && (
        <div className="overflow-hidden rounded-xl border border-line bg-white" aria-busy={employees.loading}>
          {employees.data && rows.length === 0 ? (
            <EmptyState title={q ? 'No employees match your search' : 'No employees yet'}>
              {q ? 'Check the spelling or try a shorter search.' : 'Add an employee so you can start assigning tasks.'}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[44rem] text-left text-sm ${employees.loading ? 'opacity-60' : ''}`}>
                <thead className="border-b border-line bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 text-right font-semibold">Open</th>
                    <th className="px-4 py-3 text-right font-semibold">Completed</th>
                    <th className="px-4 py-3 text-right font-semibold">Failed</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((emp) => (
                    <tr key={emp.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </td>
                      <td className="px-4 py-3">{emp.department ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{emp.tasks.pending + emp.tasks.inProgress}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{emp.tasks.completed}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{emp.tasks.failed}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button aria-label={`Edit ${emp.name}`} title="Edit" onClick={() => setEditing(emp)} className="rounded p-2 text-slate-600 hover:bg-slate-100">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button aria-label={`Delete ${emp.name}`} title="Delete" onClick={() => setDeleting(emp)} className="rounded p-2 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {employees.data && (
        <Pagination page={employees.data.page} totalPages={employees.data.totalPages} totalElements={employees.data.totalElements} size={PAGE_SIZE} onPage={setPage} />
      )}

      {editing && (
        <EmployeeFormModal
          employee={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            employees.reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Remove ${deleting.name}?`}
          message={`Their account will be deleted along with the ${deleting.tasks.total} ${deleting.tasks.total === 1 ? 'task' : 'tasks'} assigned to them. This cannot be undone.`}
          confirmLabel="Remove employee"
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
