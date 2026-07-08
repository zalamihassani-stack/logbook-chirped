'use client'
import { useState } from 'react'

export function useServerAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function execute<TArgs extends unknown[], TReturn>(
    action: (...args: TArgs) => Promise<TReturn>,
    ...args: TArgs
  ): Promise<TReturn | { error: string }> {
    setLoading(true)
    setError('')
    try {
      const res = await action(...args)
      setLoading(false)
      const result = res as ({ error?: string } & TReturn) | null | undefined
      if (result?.error) {
        setError(result.error)
        return { error: result.error }
      }
      return res
    } catch (err) {
      setLoading(false)
      const message = (err as Error)?.message ?? 'Une erreur inattendue est survenue.'
      setError(message)
      return { error: message }
    }
  }

  return { execute, loading, error, setError }
}
