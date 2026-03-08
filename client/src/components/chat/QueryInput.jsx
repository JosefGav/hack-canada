import React, { useState, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'

export default function QueryInput() {
  const [input, setInput] = useState('')
  const [lawCode, setLawCode] = useState('')
  const [laws, setLaws] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { sendQuery, isLoading } = useChatStore()

  useEffect(() => {
    fetch('/api/laws')
      .then(r => r.json())
      .then(data => setLaws(Array.isArray(data) ? data : []))
      .catch(() => { })

    // Close dropdown when clicking outside
    const handleClickOutside = () => setIsDropdownOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendQuery(input.trim(), lawCode || null)
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t relative" style={{ borderColor: 'var(--navy-lighter)' }}>
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, var(--navy-lighter), transparent)' }} />
      <div className="flex gap-3" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 py-2.5 rounded-lg text-sm text-left outline-none flex items-center justify-between"
            style={{
              background: '#fff',
              color: 'var(--text-primary)',
              border: `1px solid ${isDropdownOpen ? 'var(--gold-dim)' : 'var(--navy-lighter)'}`,
              minWidth: '180px',
              maxWidth: '220px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <span className="truncate">
              {lawCode ? laws.find(l => l.code === lawCode)?.short_title_en || lawCode : 'All Laws'}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0, marginLeft: '8px' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-[300px] rounded-lg shadow-xl border overflow-hidden flex flex-col z-50"
              style={{
                background: '#fff',
                borderColor: 'var(--navy-lighter)',
                maxHeight: '300px'
              }}
            >
              <div className="p-2 border-b" style={{ borderColor: 'var(--navy-lighter)', background: 'var(--navy-light)' }}>
                <input
                  type="text"
                  placeholder="Search laws..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded text-sm outline-none"
                  style={{
                    background: '#fff',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--navy-lighter)'
                  }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setLawCode('')
                    setIsDropdownOpen(false)
                    setSearchQuery('')
                  }}
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{
                    background: !lawCode ? 'rgba(196, 91, 91, 0.08)' : 'transparent',
                    color: !lawCode ? 'var(--gold)' : 'var(--text-primary)'
                  }}
                >
                  All Laws
                </button>
                {laws
                  .filter(law =>
                    law.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    law.short_title_en.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(law => (
                    <button
                      key={law.code}
                      type="button"
                      onClick={() => {
                        setLawCode(law.code)
                        setIsDropdownOpen(false)
                        setSearchQuery('')
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors truncate"
                      style={{
                        background: lawCode === law.code ? 'rgba(196, 91, 91, 0.08)' : 'transparent',
                        color: lawCode === law.code ? 'var(--gold)' : 'var(--text-primary)'
                      }}
                      title={law.short_title_en}
                    >
                      {law.code} - {law.short_title_en}
                    </button>
                  ))}
                {laws.filter(law => law.code.toLowerCase().includes(searchQuery.toLowerCase()) || law.short_title_en.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="px-3 py-3 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    No laws found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question or enter a query..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-300"
          style={{
            background: '#fff',
            color: 'var(--text-primary)',
            border: '1px solid var(--navy-lighter)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--gold-dim)'
            e.target.style.boxShadow = '0 0 0 1px var(--gold-dim), inset 0 1px 2px rgba(0,0,0,0.04)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--navy-lighter)'
            e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md flex items-center gap-2 ${input.trim() ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''}`}
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #C45B5B, #D4817E)' : 'var(--navy-lighter)',
            color: input.trim() ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${input.trim() ? 'transparent' : 'var(--navy-lighter)'}`,
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  )
}
