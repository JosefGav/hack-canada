import React, { useState, useEffect } from 'react'
import ChatPane from '../chat/ChatPane'
import AuditorPane from '../auditor/AuditorPane'
import StatusBar from './StatusBar'
import { useChatStore } from '../../stores/chatStore'
import { useAuditorStore } from '../../stores/auditorStore'

export default function AppShell() {
  const { activeTab, setActiveTab } = useAuditorStore()
  const { isAudioPlaying, stopAudio, setSelectedVoiceId, setSelectedPresetId } = useChatStore()
  const [presets, setPresets] = useState([])
  const [activePreset, setActivePreset] = useState('')

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

      <header className="flex items-center justify-between px-6 py-3 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--gold)' }}>
              StatuteLens
            </h1>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
        style={{ background: 'linear-gradient(to right, transparent, var(--navy-lighter), transparent)' }}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="w-[60%] flex flex-col relative">
          <ChatPane />
          <div className="absolute right-0 top-0 bottom-0 w-[1px]"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--navy-lighter), transparent)' }}
          />
        </div>

        <div className="w-[40%] flex flex-col" style={{ background: 'var(--navy-light)' }}>
          <div className="flex border-b" style={{ borderColor: 'var(--navy-lighter)', background: 'var(--navy)' }}>
            {['source', 'analysis', 'graph'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-all ${activeTab === tab ? 'border-b-2' : ''}`}
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
