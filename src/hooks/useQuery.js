import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `fetcher` whenever `deps` change and keeps the previous data on screen while the next
 * request is in flight (so tables do not flash empty when paging or filtering).
 * Responses for outdated requests are ignored.
 */
export function useQuery(fetcher, deps) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const key = JSON.stringify([...deps, version])

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => active && setResult({ key, data, error: null }))
      .catch((error) => active && setResult((prev) => ({ key, data: prev.data, error })))
    return () => {
      active = false
    }
    // `key` already encodes every dependency of the fetcher
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    loading: result.key !== key,
    reload,
  }
}
