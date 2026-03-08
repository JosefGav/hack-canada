import React from 'react'
import { motion } from 'framer-motion'

export default function SectionViewer({ section }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4 pb-3 border-b" style={{ borderColor: 'var(--navy-lighter)' }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--gold-dim)' }}>
          {section.law_code}
        </p>
        <h2 className="text-lg font-semibold">{section.law_title}</h2>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="mono text-lg font-medium" style={{ color: 'var(--gold)' }}>
            Section {section.label}
          </span>
          {section.marginal_note && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              — {section.marginal_note}
            </span>
          )}
        </div>
      </div>

      <div className="relative mb-6 p-3 -mx-3 rounded z-0" style={{ color: 'var(--text-primary)' }}>
        <motion.div
          key={`bg-${section.lims_id}`}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 rounded pointer-events-none -z-10"
          style={{ backgroundColor: 'var(--gold)' }}
        />
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {section.content_text}
        </div>
      </div>

      {section.content_xml && (
        <details className="mt-4">
          <summary className="text-xs cursor-pointer"
            style={{ color: 'var(--gold-dim)' }}>
            View Raw XML
          </summary>
          <pre className="mt-2 p-3 rounded text-xs overflow-x-auto mono"
            style={{ background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--navy-lighter)' }}>
            {section.content_xml}
          </pre>
        </details>
      )}
    </div>
  )
}
