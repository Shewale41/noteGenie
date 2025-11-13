'use client'

import { useState } from 'react'

const tabs = [
  { id: 'summary', label: 'Summary Notes' },
  { id: 'transcript', label: 'Transcript' },
]

export default function NotesTabs({ summary, transcript }) {
  const [activeTab, setActiveTab] = useState('summary')

  const renderContent = () => {
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

