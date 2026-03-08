import React, { useState, useEffect } from 'react'
import ChatPane from '../chat/ChatPane'
import AuditorPane from '../auditor/AuditorPane'
import StatusBar from './StatusBar'
import { useChatStore } from '../../stores/chatStore'
import { useAuditorStore } from '../../stores/auditorStore'

export default function AppShell({ onBack }) {
  const { activeTab, setActiveTab } = useAuditorStore()
  const { isAudioPlaying, stopAudio, setSelectedVoiceId, setSelectedPresetId } = useChatStore()
  const [presets, setPresets] = useState([])
  const [activePreset, setActivePreset] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)

  const personaTints = {
    assertive: 'radial-gradient(ellipse at top right, rgba(194,59,34,0.06), transparent 50%)',
    analytical: 'radial-gradient(ellipse at top right, rgba(74,157,91,0.06), transparent 50%)',
    empathetic: 'radial-gradient(ellipse at top right, rgba(196,91,91,0.06), transparent 50%)'
  }

  const personaAccents = {
    assertive: { primary: '#C23B22', dim: '#992B16' },
    analytical: { primary: '#4A9D5B', dim: '#357A43' },
    empathetic: { primary: '#C45B5B', dim: '#A04848' }
  }

  useEffect(() => {
    const accents = personaAccents[activePreset] || personaAccents.empathetic
    document.documentElement.style.setProperty('--gold', accents.primary)
    document.documentElement.style.setProperty('--gold-dim', accents.dim)
  }, [activePreset])

  useEffect(() => {
    fetch('/api/voice/presets')
      .then(r => r.json())
      .then(data => {
        setPresets(data.presets || [])
        if (data.presets?.length) {
          setActivePreset(data.presets[0].id)
          setSelectedVoiceId(data.presets[0].voice_id)
          setSelectedPresetId(data.presets[0].id)
        }
      })
      .catch(() => { })
  }, [])

  const handlePresetChange = (presetId) => {
    setActivePreset(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setSelectedVoiceId(preset.voice_id)
      setSelectedPresetId(preset.id)
    }
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--navy)' }}>
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{
          background: personaTints[activePreset] || 'transparent',
          zIndex: 0
        }}
      />

      <header className="flex items-center justify-between px-6 py-3 relative z-10" style={{ minHeight: '48px' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-3">
            <h1 onClick={onBack} className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity leading-none" style={{ color: 'var(--gold)' }}>
              SpecterBot
            </h1>
            <span className="text-sm leading-none" style={{ color: 'var(--text-secondary)' }}>
              Canadian Federal Law
            </span>
          </div>

          {isAudioPlaying && (
            <button
              onClick={stopAudio}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                background: 'rgba(196, 91, 91, 0.1)',
                color: 'var(--gold)',
                border: '1px solid rgba(196, 91, 91, 0.2)'
              }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
              Stop Voice
            </button>
          )}
        </div>

        {presets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Counsel:</span>
            <div className="flex gap-1">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: activePreset === p.id ? 'rgba(196, 91, 91, 0.1)' : 'transparent',
                    color: activePreset === p.id ? 'var(--gold)' : 'var(--text-secondary)',
                    border: `1px solid ${activePreset === p.id ? 'var(--gold-dim)' : 'var(--navy-lighter)'}`,
                  }}
                  title={p.description}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="w-full h-[1px] relative z-20"
        style={{ background: 'var(--navy-lighter)' }}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="flex flex-col relative transition-all duration-300 ease-in-out" style={{ width: panelOpen ? '60%' : '100%' }}>
          <ChatPane />
          {panelOpen && (
            <div className="absolute right-0 top-0 bottom-0 w-[1px]"
              style={{ background: 'var(--navy-lighter)' }}
            />
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-5 h-10 rounded-l-md transition-all duration-200 hover:opacity-100"
          style={{
            background: 'var(--navy-lighter)',
            color: 'var(--text-secondary)',
            opacity: 0.7,
            right: panelOpen ? '40%' : '0',
          }}
          title={panelOpen ? 'Collapse panel' : 'Expand panel'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {panelOpen ? <polyline points="9 6 15 12 9 18" /> : <polyline points="15 6 9 12 15 18" />}
          </svg>
        </button>

        <div
          className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            width: panelOpen ? '40%' : '0',
            opacity: panelOpen ? 1 : 0,
            background: 'var(--navy-light)',
          }}
        >
          <div className="flex border-b" style={{ borderColor: 'var(--navy-lighter)', background: 'var(--navy)' }}>
            {['source', 'analysis', 'graph'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-2' : ''}`}
                style={{
                  borderColor: activeTab === tab ? 'var(--gold)' : 'transparent',
                  color: activeTab === tab ? 'var(--gold)' : 'var(--text-secondary)',
                  opacity: activeTab === tab ? 1 : 0.7
                }}
              >
                {tab === 'source' ? 'Source Viewer' : tab === 'analysis' ? 'Analysis' : 'Legal Graph'}
              </button>
            ))}
          </div>
          <AuditorPane activeTab={activeTab} />
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
