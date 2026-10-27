import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, totalElements, size, onPage }) {
  if (!totalElements) return null
  const from = page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  const button =
    'inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm">
      <p className="text-slate-600">
        Showing {from}–{to} of {totalElements}
      </p>
      <div className="flex items-center gap-2">
        <button className={button} onClick={() => onPage(page - 1)} disabled={page === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="px-1 text-slate-600">
          Page {page + 1} of {totalPages}
        </span>
        <button className={button} onClick={() => onPage(page + 1)} disabled={page + 1 >= totalPages}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
