import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function LandingPage({ onEnter }) {
  const [query, setQuery] = useState('')

  const handleDive = () => {
    onEnter(query.trim() || null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 40%, #faf5f3 0%, #f0e8e4 100%)',
      }}
    >
      {/* Dot grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4b8b0 0.8px, transparent 0.8px)',
          backgroundSize: '24px 24px',
          opacity: 0.4,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6 px-6"
      >
        <h1
          className="text-7xl font-bold italic"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#C45B5B',
          }}
        >
          SpecterBot
        </h1>

        <p className="text-lg tracking-wide" style={{ color: '#3a3a3a' }}>
          AI-powered <em>research</em> and <em>analysis</em> tool for{' '}
          <strong>Canadian federal law</strong>
        </p>

        <div className="mt-4 w-full max-w-lg">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDive()}
            placeholder="Ask a legal question..."
            className="w-full px-5 py-3 rounded-full text-base outline-none"
            style={{
              background: '#fff',
              color: '#3a3a3a',
              border: '1.5px solid #d4b0b0',
              fontFamily: "'Lora', serif",
            }}
          />
        </div>

        <motion.button
          onClick={handleDive}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-2 px-12 py-3 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #C45B5B, #D4817E)',
            color: '#fff',
            border: 'none',
            letterSpacing: '0.15em',
          }}
        >
          Dive Deeper
        </motion.button>
      </motion.div>
    </div>
  )
}
