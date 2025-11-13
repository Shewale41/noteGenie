'use client'

import { useMemo, useState } from 'react'
import MermaidMindMap from '@/components/MermaidMindMap'

export default function NotesTabs({ summary, transcript }) {
  const hasSummary = Boolean(summary?.trim())
  const hasTranscript = Boolean(transcript?.trim())

  const tabs = useMemo(() => {
    const base = []
    if (hasSummary) base.push({ id: 'summary', label: 'Summary Notes' })
    if (hasTranscript) base.push({ id: 'transcript', label: 'Transcript' })
    if (hasSummary) base.push({ id: 'mindmap', label: 'Mind Map' })
    return base.length ? base : [{ id: 'empty', label: 'Notes' }]
  }, [hasSummary, hasTranscript])

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'empty')

  const renderContent = () => {
    if (activeTab === 'mindmap') {
      return <MermaidMindMap summary={summary} />
    }

    const content = activeTab === 'summary' ? summary : transcript

    if (!content) {
      return (
        <div className="p-8 text-center text-gray-500">
          Content not available yet. Try reprocessing the lecture.
        </div>
      )
    }

    return (
      <div className="p-6 bg-white rounded-b-xl border border-gray-200 text-gray-800 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex rounded-t-xl overflow-hidden border border-gray-200">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary-600 text-white shadow-inner'
                  : 'bg-white text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {renderContent()}
    </div>
  )
}

