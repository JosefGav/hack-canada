import React from 'react'
import { useChatStore } from '../../stores/chatStore'

export default function StatusBar() {
  const messages = useChatStore(s => s.messages)
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')

  const confidence = lastAssistant?.confidence
  const citationCount = lastAssistant?.citations?.length || 0

  const confidenceColor = {
    high: 'var(--gold)',
    medium: '#D4A843',
    low: 'var(--red)',
  }[confidence] || 'var(--text-secondary)'

  return (
    <div className="flex items-center justify-between px-6 py-2 text-xs border-t"
      style={{ borderColor: 'var(--navy-lighter)', color: 'var(--text-secondary)' }}>
      <div className="flex items-center gap-4">
        {confidence && (
          <span>
            Confidence: <span style={{ color: confidenceColor }} className="font-medium uppercase">{confidence}</span>
          </span>
        )}
        {citationCount > 0 && (
          <span>{citationCount} section{citationCount !== 1 ? 's' : ''} cited</span>
        )}
      </div>
      <span>Powered by Gemini + Canadian Federal Law XML</span>
    </div>
  )
}
