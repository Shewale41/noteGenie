'use client'

import { useMemo } from 'react'
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow'
import 'reactflow/dist/base.css'
import { buildMindMapGraph } from '@/lib/mindmap'

const panelStyle = 'absolute left-4 top-4 bg-white/90 text-xs px-3 py-2 rounded shadow'

export default function MindMap({ summary }) {
  const graph = useMemo(() => buildMindMapGraph(summary || ''), [summary])

  if (!summary?.trim()) {
    return (
      <div className="p-6 text-center text-gray-500">
        Summary not available yet. Generate notes to view the mind map.
      </div>
    )
  }

  if (!graph.nodes.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        Mind map could not be created from the current summary.
      </div>
    )
  }

  return (
    <div className="h-[520px] bg-white rounded-b-xl border border-gray-200 overflow-hidden">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.4, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-right" showInteractive={false} className="bg-white/80" />
        <MiniMap
          pannable
          zoomable
          className="!bg-white/70"
          nodeStrokeColor="#0ea5e9"
          nodeColor="#bae6fd"
        />
        <Background gap={16} color="#e2e8f0" />
        <div className={panelStyle}>Drag to explore • Scroll to zoom</div>
      </ReactFlow>
    </div>
  )
}
