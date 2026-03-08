import React, { useMemo } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { useChatStore } from '../../stores/chatStore'

const nodeStyle = {
  background: '#fff',
  color: 'var(--gold)',
  border: '1px solid var(--gold-dim)',
  borderRadius: '6px',
  padding: '12px 16px',
  fontSize: '12px',
  fontFamily: '"IBM Plex Mono", monospace',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
  maxWidth: '220px'
}

const questionNodeStyle = {
  background: 'var(--navy-light)',
  color: 'var(--text-primary)',
  border: '1px solid var(--navy-lighter)',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '13px',
  fontFamily: '"Lora", serif',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
  maxWidth: '260px'
}

export default function LegalGraph() {
  const messages = useChatStore(state => state.messages)

  const { nodes, edges } = useMemo(() => {
    const newNodes = []
    const newEdges = []
    const sectionNodes = new Set()
    let yOffset = 50

    messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        const qId = `q-${idx}`

        let xOffset = 50
        const spacing = 220
        const nextMsg = messages[idx + 1]

        const lawCount = nextMsg?.retrieved_sections?.length || 1
        const blockWidth = (lawCount - 1) * spacing
        const questionCenterX = 50 + (blockWidth / 2)

        newNodes.push({
          id: qId,
          position: { x: questionCenterX, y: yOffset },
          data: { label: `Q: ${msg.content}` },
          style: questionNodeStyle
        })

        if (nextMsg && nextMsg.role === 'assistant' && nextMsg.retrieved_sections) {
          yOffset += 140

          nextMsg.retrieved_sections.forEach((sec, sIdx) => {
            const sId = `s-${sec.lims_id}`

            if (!sectionNodes.has(sId)) {
              sectionNodes.add(sId)
              newNodes.push({
                id: sId,
                position: { x: xOffset, y: yOffset },
                data: { label: `Sec ${sec.label} - ${sec.law_code}` },
                style: nodeStyle
              })
            }

            newEdges.push({
              id: `e-${qId}-${sId}`,
              source: qId,
              target: sId,
              animated: true,
              style: {
                stroke: 'var(--gold)',
                strokeWidth: sec.score > 0.8 ? 2 : 1,
                opacity: 0.6
              }
            })

            xOffset += spacing
          })
        }
        yOffset += 160
      }
    })

    if (newNodes.length === 0) {
      newNodes.push({
        id: 'empty',
        position: { x: 250, y: 150 },
        data: { label: 'Start chatting to build the Live RAG graph' },
        style: questionNodeStyle
      })
    }

    return { nodes: newNodes, edges: newEdges }
  }, [messages])

  return (
    <div className="flex-1 w-full relative" style={{ background: 'var(--navy)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
      >
        <Background color="#e0d3cc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
