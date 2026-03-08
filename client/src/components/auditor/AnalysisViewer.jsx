import React from 'react'
import { motion } from 'framer-motion'
import { useAuditorStore } from '../../stores/auditorStore'

export default function AnalysisViewer() {
    const { activeSection, analysisText, isAnalyzing, analyzeSection } = useAuditorStore()

    if (!activeSection) return null

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 pb-3 border-b" style={{ borderColor: 'var(--navy-lighter)' }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--gold-dim)' }}>
                    Layman's Translator
                </p>
                <h2 className="text-lg font-semibold">{activeSection.law_title}</h2>
            </div>

            <div className="mb-6 flex flex-col items-start gap-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Translate the dense legalese of Section {activeSection.label}{activeSection.marginal_note ? ` - ${activeSection.marginal_note}` : ''} into plain English.
                </p>

                <button
                    onClick={() => analyzeSection(activeSection.lims_id)}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2"
                    style={{
                        background: isAnalyzing ? 'var(--navy-lighter)' : 'linear-gradient(135deg, #C45B5B, #D4817E)',
                        color: isAnalyzing ? 'var(--text-secondary)' : '#fff',
                        opacity: isAnalyzing ? 0.7 : 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {isAnalyzing ? (
                        <>
                            <div className="w-3 h-3 rounded-full border-2 border-[var(--text-secondary)] border-t-transparent animate-spin" />
                            Translating...
                        </>
                    ) : (
                        'Translate to Plain English'
                    )}
                </button>
            </div>

            {analysisText && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-lg text-sm leading-relaxed"
                    style={{
                        background: 'rgba(196, 91, 91, 0.05)',
                        border: '1px solid var(--gold-dim)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <div className="whitespace-pre-wrap">
                        {analysisText}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
