'use client'

import { useState } from 'react'

// Format markdown to HTML (same as NotesTabs)
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
    .replace(/^### (.*$)/gim, '<h3 style="font-weight: 600; font-size: 16px; margin-top: 16px; margin-bottom: 8px; color: #111827;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-weight: 700; font-size: 18px; margin-top: 20px; margin-bottom: 12px; color: #111827;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-weight: 700; font-size: 20px; margin-top: 24px; margin-bottom: 16px; color: #111827;">$1</h1>')
  
  // Bold (must come before italic)
  html = html.replace(/\*\*([^*]+?)\*\*/gim, '<strong style="font-weight: 600; color: #111827;">$1</strong>')
  
  // Italic (only single asterisks, not part of bold)
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/gim, '$1<em style="font-style: italic;">$2</em>$3')
  
  // Bullet points and lists
  const lines = html.split('\n')
  const processedLines = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const bulletMatch = line.match(/^(\*|-|\d+\.)\s+(.+)$/)
    
    if (bulletMatch) {
      if (!inList) {
        processedLines.push('<ul style="list-style-type: disc; margin-left: 24px; margin-top: 12px; margin-bottom: 12px; padding-left: 0;">')
        inList = true
      }
      processedLines.push(`<li style="margin-bottom: 4px; color: #111827;">${bulletMatch[2]}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (line.trim()) {
        // Wrap non-list lines in paragraphs
        if (!line.match(/^<[h]/)) {
          processedLines.push(`<p style="margin-bottom: 12px; color: #111827; line-height: 1.6;">${line}</p>`)
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

export default function ExportPDFButton({ lecture, summary, transcript }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)

      // Dynamic import to avoid SSR issues
      const { default: jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      // Use the summary if available, otherwise transcript
      const notesContent = summary || transcript
      if (!notesContent) {
        alert('No notes content available to export.')
        return
      }

      // Format the markdown content to HTML
      const formattedHTML = formatMarkdown(notesContent)

      // Create a completely clean container with ONLY the notes content
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '210mm' // A4 width
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.padding = '20mm'
      tempContainer.style.fontFamily = 'Arial, sans-serif'
      tempContainer.style.color = '#111827'
      tempContainer.style.fontSize = '14px'
      tempContainer.style.lineHeight = '1.6'

      // Add title
      const titleDiv = document.createElement('div')
      titleDiv.style.marginBottom = '24px'
      titleDiv.style.paddingBottom = '16px'
      titleDiv.style.borderBottom = '2px solid #e5e7eb'
      titleDiv.innerHTML = `
        <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin: 0 0 8px 0; line-height: 1.2;">
          ${(lecture.title || 'Untitled Lecture').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </h1>
        <p style="font-size: 12px; color: #6b7280; margin: 0;">
          Processed on: ${new Date(lecture.created_at).toLocaleString()}
        </p>
      `
      tempContainer.appendChild(titleDiv)

      // Create a clean content div with ONLY the notes text (no UI elements)
      const cleanContentDiv = document.createElement('div')
      cleanContentDiv.innerHTML = formattedHTML
      cleanContentDiv.style.padding = '0'
      cleanContentDiv.style.margin = '0'
      cleanContentDiv.style.border = 'none'
      cleanContentDiv.style.backgroundColor = '#ffffff'
      cleanContentDiv.style.color = '#111827'
      cleanContentDiv.style.fontSize = '14px'
      cleanContentDiv.style.lineHeight = '1.6'
      cleanContentDiv.style.fontFamily = 'Arial, sans-serif'

      tempContainer.appendChild(cleanContentDiv)
      document.body.appendChild(tempContainer)

      try {
        // Create canvas from the clean content
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
        })

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        // Add image
        const imgData = canvas.toDataURL('image/png', 1.0)
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Add new pages if content is longer than one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        // Clean up
        document.body.removeChild(tempContainer)

        // Save PDF
        const filename = `notes-${(lecture.title || 'lecture').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`
        pdf.save(filename)
      } catch (canvasError) {
        // Clean up on error
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer)
        }
        throw canvasError
      }
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExportPDF}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? 'Exporting...' : '📄 Export PDF'}
    </button>
  )
}

