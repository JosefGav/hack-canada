import React from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

const nodeStyle = {
  background: 'var(--navy-light)',
  color: 'var(--gold)',
  border: '1px solid var(--gold-dim)',
  borderRadius: '6px',
  padding: '12px 16px',
  fontSize: '12px',
  fontFamily: '"IBM Plex Mono", monospace',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
}

const initialNodes = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Section 34(1) - Defense' }, style: nodeStyle },
  { id: '2', position: { x: 100, y: 180 }, data: { label: 'Section 34(2) - Factors' }, style: nodeStyle },
  { id: '3', position: { x: 400, y: 180 }, data: { label: 'Section 35 - Property' }, style: nodeStyle },
  { id: '4', position: { x: 250, y: 310 }, data: { label: 'Section 265 - Assault' }, style: nodeStyle },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--gold)' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'var(--gold)' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: 'var(--text-secondary)' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: 'var(--text-secondary)' } },
]

export default function LegalGraph() {
  return (
    <div className="flex-1 w-full relative" style={{ background: 'var(--navy)' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
      >
        <Background color="#132240" gap={16} />
        <Controls />
      </ReactFlow>
      <div className="absolute top-4 left-4 p-3 rounded-lg border text-xs"
        style={{ background: 'rgba(19, 34, 64, 0.8)', borderColor: 'var(--navy-lighter)', color: 'var(--text-secondary)' }}>
        <p className="mb-1 uppercase tracking-wider text-[10px]" style={{ color: 'var(--gold-dim)' }}>Prototype Graph</p>
        <p>Statutory cross-references</p>
      </div>
    </div>
  )
}
