import React from 'react'
import { useAuditorStore } from '../../stores/auditorStore'

export default function CitationBadge({ citation, inline = false }) {
  const loadSection = useAuditorStore(s => s.loadSection)

  const handleClick = () => {
    if (citation.lims_id) {
      loadSection(citation.lims_id)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${inline ? 'inline-flex mx-0.5' : 'flex'}
        items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        transition-all duration-150 hover:scale-105
        ${citation.hallucinated ? 'opacity-50 line-through' : 'cursor-pointer'}
      `}
      style={{
        background: citation.hallucinated ? 'var(--red)' : 'rgba(196, 91, 91, 0.1)',
        color: citation.hallucinated ? '#fff' : 'var(--gold)',
        border: `1px solid ${citation.hallucinated ? 'var(--red)' : 'var(--gold-dim)'}`,
      }}
      title={citation.hallucinated ? 'Citation not found in retrieved sources' : 'Click to view source'}
    >
      <span className="mono">Sec. {citation.label}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{citation.law_code}</span>
    </button>
  )
}
