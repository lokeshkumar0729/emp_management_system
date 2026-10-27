export default function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-xs tabular-nums text-slate-500">{value}%</span>
    </div>
  )
}
