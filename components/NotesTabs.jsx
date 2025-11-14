'use client'

import { useMemo, useState } from 'react'
import MermaidMindMap from '@/components/MermaidMindMap'

// Format markdown to HTML
const formatMarkdown = (text) => {
  if (!text) return ''
  
  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Convert markdown to HTML
  // Headers (must come before other formatting)
  html = html
    .replace(/^### (.*$)/gim, '<h3 class="font-semibold text-base mt-4 mb-2 text-gray-900">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="font-bold text-lg mt-5 mb-3 text-gray-900">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="font-bold text-xl mt-6 mb-4 text-gray-900">$1</h1>')
  
  // Bold (must come before italic)
  html = html.replace(/\*\*([^*]+?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
  
  // Italic (only single asterisks, not part of bold)
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/gim, '$1<em class="italic">$2</em>$3')
  
  // Bullet points and lists
  const lines = html.split('\n')
  const processedLines = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const bulletMatch = line.match(/^(\*|-|\d+\.)\s+(.+)$/)
    
    if (bulletMatch) {
      if (!inList) {
        processedLines.push('<ul class="list-disc ml-6 my-3 space-y-1">')
        inList = true
      }
      processedLines.push(`<li class="text-gray-900">${bulletMatch[2]}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (line.trim()) {
        // Wrap non-list lines in paragraphs
        if (!line.match(/^<[h]/)) {
          processedLines.push(`<p class="mb-3 text-gray-900">${line}</p>`)
        } else {
          processedLines.push(line)
        }
      }
    }
  }
  
  if (inList) {
    processedLines.push('</ul>')
  }
  
  html = processedLines.join('\n')
  
  return html
}

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
      <div 
        className="p-6 bg-white rounded-b-xl border border-gray-200 text-gray-900 leading-relaxed prose prose-sm max-w-none"
        data-notes-text-content
        dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
      />
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

