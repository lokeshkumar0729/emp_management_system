// Dates from the API are plain "YYYY-MM-DD" strings; parse them as local dates so they never shift a day.
export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function daysOverdue(iso) {
  const due = new Date(`${iso}T00:00:00`)
  const today = new Date(`${todayIso()}T00:00:00`)
  return Math.max(0, Math.round((today - due) / 86_400_000))
}
