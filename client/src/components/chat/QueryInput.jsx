import React, { useState, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'

export default function QueryInput() {
  const [input, setInput] = useState('')
  const [lawCode, setLawCode] = useState('')
  const [laws, setLaws] = useState([])
  const { sendQuery, isLoading } = useChatStore()

  useEffect(() => {
    fetch('/api/laws')
      .then(r => r.json())
      .then(data => setLaws(data))
      .catch(() => { })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendQuery(input.trim(), lawCode || null)
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t" style={{ borderColor: 'var(--navy-lighter)' }}>
      <div className="flex gap-2">
        <select
          value={lawCode}
          onChange={e => setLawCode(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--navy-lighter)',
            color: 'var(--text-primary)',
            border: '1px solid var(--navy-lighter)',
            minWidth: '140px',
          }}
        >
          <option value="">All Laws</option>
          {laws.map(law => (
            <option key={law.code} value={law.code}>
              {law.code} - {law.short_title_en}
            </option>
          ))}
        </select>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about Canadian federal law..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--navy-lighter)',
            color: 'var(--text-primary)',
            border: '1px solid var(--navy-lighter)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--navy-lighter)'}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: input.trim() ? 'var(--gold)' : 'var(--navy-lighter)',
            color: input.trim() ? 'var(--navy)' : 'var(--text-secondary)',
          }}
        >
          Search
        </button>
      </div>
    </form>
  )
}
