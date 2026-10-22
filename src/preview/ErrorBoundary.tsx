import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string; onError?: (message: string) => void }, { message: string | null }> {
  state = { message: null as string | null }
  static getDerivedStateFromError(e: Error) {
    return { message: e.message }
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    this.props.onError?.(`${this.props.label ?? 'component'}: ${e.message}${info.componentStack ? '' : ''}`)
  }
  render() {
    if (this.state.message) return <div className="pv__error">Could not render {this.props.label ?? 'this component'}: {this.state.message}</div>
    return this.props.children
  }
}
