import React from 'react'
import { useAuditorStore } from '../../stores/auditorStore'
import SectionViewer from './SectionViewer'
import LegalGraph from './LegalGraph'

export default function AuditorPane({ activeTab }) {
  const { activeSection, isLoading } = useAuditorStore()

  if (activeTab === 'graph') {
    return <LegalGraph />
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>Loading section...</p>
      </div>
    )
  }

  if (!activeSection) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
            Click a citation badge to view the source
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            The exact statutory text used by the AI will appear here
          </p>
        </div>
      </div>
    )
  }

  return <SectionViewer section={activeSection} />
}
