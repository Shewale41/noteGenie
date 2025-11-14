'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { generateMermaidFromSummary, validateMermaidSyntax } from '@/lib/mermaid'
import { toPng, toSvg } from 'html-to-image'

export default function MermaidMindMap({ summary }) {
  const [mermaidCode, setMermaidCode] = useState('')
  const [orientation, setOrientation] = useState('TD')
  const [renderedSvg, setRenderedSvg] = useState(null)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const mermaidInitialized = useRef(false)
  const renderIdRef = useRef(null)

  // Generate initial Mermaid code from summary
  useEffect(() => {
    if (summary?.trim()) {
      const generated = generateMermaidFromSummary(summary, { orientation })
      setMermaidCode(generated)
      setRenderedSvg(null)
      setError(null)
    } else {
      setMermaidCode('graph TD\n    Root["No summary available"]')
      setRenderedSvg(null)
    }
  }, [summary, orientation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending renders
      renderIdRef.current = null
      setRenderedSvg(null)
    }
  }, [])

  // Render Mermaid diagram (client-side only)
  const handleRender = useCallback(async () => {
    if (!mermaidCode.trim()) {
      setError('Mermaid code is empty')
      return
    }

    const validationError = validateMermaidSyntax(mermaidCode)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError(null)
      setIsRendering(true)
      setRenderedSvg(null)

      // Dynamic import to avoid SSR issues
      const mermaid = (await import('mermaid')).default
      
      // Initialize Mermaid (only once)
      if (!mermaidInitialized.current) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 10,
          },
          themeVariables: {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
          },
        })
        mermaidInitialized.current = true
      }

      // Create unique render ID
      const renderId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      renderIdRef.current = renderId

      // Render the diagram using the async render method
      const result = await mermaid.render(renderId + '-svg', mermaidCode)
      
      // Only update if this is still the current render (prevent race conditions)
      if (renderIdRef.current === renderId && result && result.svg) {
        setRenderedSvg(result.svg)
        setIsRendering(false)
      }
    } catch (err) {
      console.error('Mermaid render error:', err)
      setError(`Failed to render Mermaid diagram: ${err.message}`)
      setIsRendering(false)
      setRenderedSvg(null)
    }
  }, [mermaidCode])

  // Generate/Regenerate from summary
  const handleGenerate = useCallback(() => {
    if (!summary?.trim()) {
      setError('No summary available to generate mind map')
      return
    }
    
    const generated = generateMermaidFromSummary(summary, { orientation })
    setMermaidCode(generated)
    setRenderedSvg(null)
    setError(null)
    renderIdRef.current = null
  }, [summary, orientation])

  // Copy Mermaid code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode)
      alert('Mermaid code copied to clipboard!')
    } catch (err) {
      console.error('Copy failed:', err)
      alert('Failed to copy. Please copy manually.')
    }
  }, [mermaidCode])

  // Export as PNG
  const handleExportPNG = useCallback(async () => {
    if (!renderedSvg || !containerRef.current) {
      alert('Please render the diagram first')
      return
    }

    try {
      setIsExporting(true)
      
      // Find the SVG element (the actual diagram, not the container with controls)
      const svgElement = containerRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('SVG element not found')
      }

      // Get original SVG dimensions
      const svgWidth = svgElement.viewBox?.baseVal?.width || svgElement.getAttribute('width') || 800
      const svgHeight = svgElement.viewBox?.baseVal?.height || svgElement.getAttribute('height') || 600
      
      // Create a temporary container with just the SVG, no controls
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = `${svgWidth}px`
      tempContainer.style.height = `${svgHeight}px`
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.padding = '20px'
      tempContainer.style.display = 'flex'
      tempContainer.style.alignItems = 'center'
      tempContainer.style.justifyContent = 'center'
      
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true)
      
      // Ensure SVG has proper dimensions and remove any transforms
      clonedSvg.setAttribute('width', svgWidth)
      clonedSvg.setAttribute('height', svgHeight)
      clonedSvg.removeAttribute('style') // Remove any inline styles that might affect rendering
      
      // Ensure text colors are preserved - check all text elements
      const textElements = clonedSvg.querySelectorAll('text, tspan')
      textElements.forEach((textEl) => {
        const fill = textEl.getAttribute('fill')
        // If fill is white or missing, set to dark color for visibility
        if (!fill || fill === '#ffffff' || fill === 'white' || fill === '#fff') {
          // Check if it's a root node (should stay white) or parent/child (should be dark)
          const parent = textEl.closest('[class*="root"]')
          if (!parent) {
            textEl.setAttribute('fill', '#0f172a') // Dark color for visibility
          }
        }
      })
      
      tempContainer.appendChild(clonedSvg)
      document.body.appendChild(tempContainer)

      try {
        const dataUrl = await toPng(tempContainer, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        })

        const link = document.createElement('a')
        link.download = `mindmap-${Date.now()}.png`
        link.href = dataUrl
        link.click()
      } finally {
        document.body.removeChild(tempContainer)
      }
    } catch (err) {
      console.error('PNG export failed:', err)
      alert('Failed to export PNG. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [renderedSvg])

  // Export as SVG
  const handleExportSVG = useCallback(async () => {
    if (!renderedSvg || !containerRef.current) {
      alert('Please render the diagram first')
      return
    }

    try {
      setIsExporting(true)
      
      // Find the SVG element
      const svgElement = containerRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('SVG element not found')
      }

      // Clone the SVG
      const clonedSvg = svgElement.cloneNode(true)
      
      // Get original dimensions
      const svgWidth = clonedSvg.viewBox?.baseVal?.width || clonedSvg.getAttribute('width') || 800
      const svgHeight = clonedSvg.viewBox?.baseVal?.height || clonedSvg.getAttribute('height') || 600
      
      // Ensure proper dimensions
      clonedSvg.setAttribute('width', svgWidth)
      clonedSvg.setAttribute('height', svgHeight)
      clonedSvg.removeAttribute('style') // Remove any inline styles
      
      // Ensure text colors are preserved - check all text elements
      const textElements = clonedSvg.querySelectorAll('text, tspan')
      textElements.forEach((textEl) => {
        const fill = textEl.getAttribute('fill')
        // If fill is white or missing, set to dark color for visibility
        if (!fill || fill === '#ffffff' || fill === 'white' || fill === '#fff') {
          // Check if it's a root node (should stay white) or parent/child (should be dark)
          const parent = textEl.closest('[class*="root"]')
          if (!parent) {
            textEl.setAttribute('fill', '#0f172a') // Dark color for visibility
          }
        }
      })

      // Convert to blob and download
      const svgString = new XMLSerializer().serializeToString(clonedSvg)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.download = `mindmap-${Date.now()}.svg`
      link.href = url
      link.click()
      
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('SVG export failed:', err)
      alert('Failed to export SVG. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [renderedSvg])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
  }, [])

  const handleZoomReset = useCallback(() => {
    // Recalculate auto-fit scale
    if (containerRef.current && svgRef.current) {
      const container = containerRef.current
      const svgElement = svgRef.current
      
      const containerWidth = container.clientWidth - 40
      const containerHeight = container.clientHeight - 40
      
      const svgWidth = svgElement.viewBox?.baseVal?.width || svgElement.clientWidth || 800
      const svgHeight = svgElement.viewBox?.baseVal?.height || svgElement.clientHeight || 600
      
      const scaleX = containerWidth / svgWidth
      const scaleY = containerHeight / svgHeight
      const autoFitScale = Math.min(scaleX, scaleY, 1) * 0.9
      
      setZoomLevel(autoFitScale)
    } else {
      setZoomLevel(1)
    }
    setPanX(0)
    setPanY(0)
  }, [])

  // Pan/drag handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }, [panX, panY])

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Auto-fit diagram when rendered and update SVG ref
  useEffect(() => {
    if (renderedSvg && containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg')
      if (svgElement) {
        svgRef.current = svgElement
        
        // Auto-fit: Calculate scale to fit container
        const container = containerRef.current
        const containerWidth = container.clientWidth - 40 // Account for padding
        const containerHeight = container.clientHeight - 40
        
        const svgWidth = svgElement.viewBox?.baseVal?.width || svgElement.clientWidth || 800
        const svgHeight = svgElement.viewBox?.baseVal?.height || svgElement.clientHeight || 600
        
        // Calculate scale to fit both width and height
        const scaleX = containerWidth / svgWidth
        const scaleY = containerHeight / svgHeight
        const autoFitScale = Math.min(scaleX, scaleY, 1) * 0.9 // 90% to leave some margin
        
        // Set initial zoom to fit
        setZoomLevel(autoFitScale)
        setPanX(0)
        setPanY(0)
      }
    }
  }, [renderedSvg])

  if (!summary?.trim()) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-b-xl border border-gray-200">
        Summary not available yet. Generate notes to view the mind map.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-b-xl border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
          >
            {mermaidCode ? 'Regenerate' : 'Generate'} Mind Map
          </button>

          <button
            type="button"
            onClick={handleRender}
            disabled={!mermaidCode.trim() || isRendering}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isRendering ? 'Rendering...' : 'Render'}
          </button>

          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-500"
          >
            <option value="TD">Top-Down</option>
            <option value="LR">Left-Right</option>
          </select>


          <button
            type="button"
            onClick={handleCopy}
            disabled={!mermaidCode.trim()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Copy Mermaid
          </button>

          <button
            type="button"
            onClick={handleExportPNG}
            disabled={!renderedSvg || isExporting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>

          <button
            type="button"
            onClick={handleExportSVG}
            disabled={!renderedSvg || isExporting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export SVG'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Mermaid code editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mermaid Code (editable)
          </label>
          <textarea
            value={mermaidCode}
            onChange={(e) => {
              setMermaidCode(e.target.value)
              setRenderedSvg(null)
              setError(null)
            }}
            className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
            placeholder="Mermaid graph syntax will appear here..."
            style={{ color: '#111827' }}
          />
        </div>

        {/* Rendered output - using React state instead of direct DOM manipulation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rendered Diagram
          </label>
          <div
            ref={containerRef}
            className="min-h-[400px] max-h-[600px] border border-gray-300 rounded-lg bg-white overflow-hidden relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : renderedSvg ? 'grab' : 'default' }}
          >
            {/* Zoom Controls - Inside the diagram box (excluded from exports) */}
            {renderedSvg && !isRendering && (
              <div 
                className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-2"
                data-html2canvas-ignore="true"
                style={{ pointerEvents: 'auto' }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomIn()
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition text-lg leading-none"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomOut()
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition text-lg leading-none"
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomReset()
                  }}
                  className="px-3 h-8 flex items-center justify-center bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition"
                  title="Reset Zoom"
                >
                  Reset
                </button>
                <span className="text-xs text-gray-600 px-2 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
            )}

            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500 text-sm">Rendering diagram...</p>
              </div>
            )}
            {!isRendering && !renderedSvg && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500 text-sm">Click "Render" to display the diagram</p>
              </div>
            )}
            {!isRendering && renderedSvg && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: renderedSvg }}
                  className="mermaid-diagram"
                  style={{
                    maxWidth: 'none',
                  }}
                />
              </div>
            )}
          </div>
          {renderedSvg && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Drag to pan • Use +/- buttons to zoom • Click Reset to fit diagram
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
