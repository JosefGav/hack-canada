import React, { Component, useState } from 'react'
import AppShell from './components/layout/AppShell'
import LandingPage from './components/layout/LandingPage'
import { useChatStore } from './stores/chatStore'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ff6b6b', background: '#faf5f3', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>React Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const sendQuery = useChatStore(s => s.sendQuery)

  const handleEnter = (query) => {
    setShowLanding(false)
    if (query) {
      setTimeout(() => sendQuery(query), 300)
    }
  }

  if (showLanding) {
    return (
      <ErrorBoundary>
        <LandingPage onEnter={handleEnter} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  )
}
