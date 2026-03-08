import React, { useState } from 'react'
import { motion } from 'framer-motion'
import CitationBadge from './CitationBadge'
import { useChatStore } from '../../stores/chatStore'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const { playMessageAudio, stopAudio, isAudioPlaying, playingMessageId } = useChatStore()

  const isPlayingThisMessage = isAudioPlaying && playingMessageId === message.id

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed"
        style={{
          background: isUser ? '#fff' : 'var(--navy-light)',
          borderLeft: isUser ? 'none' : '3px solid var(--gold-dim)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div className="whitespace-pre-wrap">
          {isUser ? message.content : renderWithCitations(message.content, message.citations)}
        </div>

        {!isUser && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t"
            style={{ borderColor: 'var(--navy-lighter)' }}>
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {message.citations?.map((c, i) => (
                <CitationBadge key={i} citation={c} />
              ))}
            </div>
            <div className="ml-4 shrink-0 flex items-center gap-2">
              <button
                onClick={() => isPlayingThisMessage ? stopAudio() : playMessageAudio(message.content, message.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors relative"
                style={{
                  color: isPlayingThisMessage ? 'var(--gold)' : 'var(--text-secondary)',
                  background: isPlayingThisMessage ? 'rgba(196, 91, 91, 0.1)' : 'rgba(0,0,0,0.03)'
                }}
              >
                {isPlayingThisMessage ? (
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 h-full bg-[var(--gold)] rounded-full animate-[waveform_1s_ease-in-out_infinite]" />
                    <span className="w-0.5 h-[60%] bg-[var(--gold)] rounded-full animate-[waveform_1s_ease-in-out_infinite_0.2s]" />
                    <span className="w-0.5 h-[80%] bg-[var(--gold)] rounded-full animate-[waveform_1s_ease-in-out_infinite_0.4s]" />
                  </div>
                ) : (
                  <span>🔊 Read Aloud</span>
                )}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                style={{
                  color: copied ? 'var(--green)' : 'var(--text-secondary)',
                  background: 'rgba(0,0,0,0.03)'
                }}
              >
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function renderWithCitations(text, citations) {
  if (!text || !citations?.length) return text

  const parts = text.split(/(\[Section [^\]]+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/\[Section ([^\]]+)\]/)
    if (match) {
      const label = match[1]
      const citation = citations.find(c => c.label === label || part.includes(c.label))
      if (citation) {
        return <CitationBadge key={i} citation={citation} inline />
      }
    }
    return <span key={i}>{part}</span>
  })
}
