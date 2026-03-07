import React, { useState, useEffect } from 'react'
import ChatPane from '../chat/ChatPane'
import AuditorPane from '../auditor/AuditorPane'
import StatusBar from './StatusBar'
import { useChatStore } from '../../stores/chatStore'

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('source')
  const { isAudioPlaying, stopAudio, setSelectedVoiceId } = useChatStore()
  const [presets, setPresets] = useState([])
  const [activePreset, setActivePreset] = useState('')

  useEffect(() => {
    fetch('/api/voice/presets')
      .then(r => r.json())
      .then(data => {
        setPresets(data.presets || [])
        if (data.presets?.length) {
          setActivePreset(data.presets[0].id)
          setSelectedVoiceId(data.presets[0].voice_id)
        }
      })
      .catch(() => { })
  }, [])

  const handlePresetChange = (presetId) => {
    setActivePreset(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (preset) setSelectedVoiceId(preset.voice_id)
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--navy)' }}>
      <header className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'var(--navy-lighter)' }}>
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
                background: 'rgba(255, 100, 100, 0.1)',
                color: '#ff6b6b',
                border: '1px solid rgba(255, 100, 100, 0.2)'
              }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff6b6b' }} />
              Stop Voice
            </button>
          )}
        </div>

        {/* Voice Preset Selector */}
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
                    background: activePreset === p.id ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
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

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 border-r flex flex-col"
          style={{ borderColor: 'var(--navy-lighter)' }}>
          <ChatPane />
        </div>

        <div className="w-3/5 flex flex-col">
          <div className="flex border-b" style={{ borderColor: 'var(--navy-lighter)' }}>
            <button
              onClick={() => setActiveTab('source')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'source' ? 'border-b-2' : ''}`}
              style={{
                borderColor: activeTab === 'source' ? 'var(--gold)' : 'transparent',
                color: activeTab === 'source' ? 'var(--gold)' : 'var(--text-secondary)',
              }}
            >
              Source Viewer
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'graph' ? 'border-b-2' : ''}`}
              style={{
                borderColor: activeTab === 'graph' ? 'var(--gold)' : 'transparent',
                color: activeTab === 'graph' ? 'var(--gold)' : 'var(--text-secondary)',
              }}
            >
              Legal Graph
            </button>
          </div>
          <AuditorPane activeTab={activeTab} />
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
