import { PRIORITY_META, STATUS_META } from '../../lib/constants'

export function StatusBadge({ status }) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
      {meta.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}>
      {meta.label}
    </span>
  )
}
