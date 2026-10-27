import { useState } from 'react'
import { CalendarDays, Tag } from 'lucide-react'
import { api } from '../../api/client'
import { useToast } from '../../context/toast-context'
import { formatDate } from '../../lib/format'
import { PriorityBadge, StatusBadge } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { primaryButton, secondaryButton } from '../../components/ui/styles'

const CONFIRMATIONS = {
  DECLINED: {
    title: 'Decline this task?',
    message: 'The task will be closed and your administrator will see it as declined. You cannot undo this.',
    confirmLabel: 'Decline task',
    success: 'Task declined',
  },
  FAILED: {
    title: 'Mark this task as failed?',
    message: 'The task will be closed as failed. You cannot undo this.',
    confirmLabel: 'Mark as failed',
    success: 'Task marked as failed',
  },
}

export default function TaskCard({ task, onChanged }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [progress, setProgress] = useState(task.percentComplete)

  const run = async (action, successMessage) => {
    setBusy(true)
    try {
      await action()
      toast.success(successMessage)
      onChanged()
    } catch (err) {
      toast.error(err.message)
      setBusy(false)
      setConfirming(null)
    }
  }

  const changeStatus = (status, success) => run(() => api.tasks.setStatus(task.id, status), success)

  return (
    <article className="flex flex-col rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug">{task.title}</h3>
      {task.description && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{task.description}</p>}

      <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
          <dt className="sr-only">Due</dt>
          <dd className={task.overdue ? 'font-semibold text-red-600' : ''}>
            Due {formatDate(task.dueDate)}
            {task.overdue && ' · overdue'}
          </dd>
        </div>
        {task.category && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 shrink-0 text-slate-400" />
            <dt className="sr-only">Category</dt>
            <dd>{task.category}</dd>
          </div>
        )}
        <p className="pl-6 text-xs text-slate-500">Assigned by {task.createdByName}</p>
      </dl>

      {task.status === 'PENDING' && (
        <div className="mt-5 flex gap-2 pt-1">
          <button className={`${primaryButton} flex-1`} disabled={busy} onClick={() => changeStatus('IN_PROGRESS', 'Task accepted')}>
            Accept
          </button>
          <button className={`${secondaryButton} flex-1`} disabled={busy} onClick={() => setConfirming('DECLINED')}>
            Decline
          </button>
        </div>
      )}

      {task.status === 'IN_PROGRESS' && (
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <div>
            <label htmlFor={`progress-${task.id}`} className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span className="tabular-nums text-slate-600">{progress}%</span>
            </label>
            <input
              id={`progress-${task.id}`}
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="mt-2 w-full accent-brand"
            />
            {progress !== task.percentComplete && (
              <button
                className={`${secondaryButton} mt-2 w-full`}
                disabled={busy}
                onClick={() => run(() => api.tasks.setProgress(task.id, progress), 'Progress saved')}
              >
                Save progress
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className={`${primaryButton} flex-1`} disabled={busy} onClick={() => changeStatus('COMPLETED', 'Task completed')}>
              Mark complete
            </button>
            <button className={`${secondaryButton} flex-1`} disabled={busy} onClick={() => setConfirming('FAILED')}>
              Mark failed
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={CONFIRMATIONS[confirming].title}
          message={CONFIRMATIONS[confirming].message}
          confirmLabel={CONFIRMATIONS[confirming].confirmLabel}
          busy={busy}
          onConfirm={() => changeStatus(confirming, CONFIRMATIONS[confirming].success)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </article>
  )
}
