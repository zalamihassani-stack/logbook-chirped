'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">Une erreur inattendue est survenue.</p>
          {this.state.error?.message && (
            <p className="mt-2 max-w-md text-sm text-slate-500">{this.state.error.message}</p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-navy)' }}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
