export const STATUS_META = {
  PENDING: { label: 'Awaiting response', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400' },
  IN_PROGRESS: { label: 'In progress', badge: 'bg-sky-100 text-sky-800', bar: 'bg-sky-500' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  FAILED: { label: 'Failed', badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
  DECLINED: { label: 'Declined', badge: 'bg-slate-200 text-slate-700', bar: 'bg-slate-400' },
}

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, { label }]) => ({ value, label }))

export const PRIORITY_META = {
  HIGH: { label: 'High', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  MEDIUM: { label: 'Medium', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  LOW: { label: 'Low', badge: 'bg-slate-50 text-slate-600 ring-slate-200' },
}

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_META).map(([value, { label }]) => ({ value, label }))
