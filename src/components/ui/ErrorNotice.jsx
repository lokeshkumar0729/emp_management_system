import { secondaryButton } from './styles'

export default function ErrorNotice({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{error.message}</span>
      {onRetry && (
        <button className={secondaryButton} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
