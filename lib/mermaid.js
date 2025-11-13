/**
 * Mermaid.js Mind Map Generator
 *
 * Converts lecture summaries (Markdown with headings and bullets) into Mermaid graph syntax.
 * Uses deterministic heuristics to parse structure:
 * - Headings (##, ###) -> parent nodes
 * - Bullets/indented items -> child nodes
 * - Truncates long labels for readability
 * - Falls back to chunking if no headings found
 */

const MAX_NODES = 12 // Very small - only key points
const MAX_LABEL_LENGTH = 30 // Shorter labels
const MAX_CHILD_NODES_PER_PARENT = 3 // Only top 3 most important items

/**
 * Sanitizes text for Mermaid node IDs and labels
 * - Removes special characters that break Mermaid syntax
 * - Truncates long text
 * - Ensures valid identifier format
 */
const sanitizeId = (text, counter = 0) => {
  if (!text) return `n${counter}`
  // Create a safe ID: only lowercase letters, numbers, and single hyphens
  let id = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Remove multiple consecutive hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 20) // Limit length
  
  // Ensure valid ID
  if (!id || id === '-' || id.length === 0) {
    id = `n${counter}`
  }
  
  // Ensure it starts with a letter or number (not a hyphen)
  if (id.startsWith('-')) {
    id = `n${id}`
  }
  
  return id
}

const sanitizeLabel = (text) => {
  if (!text) return 'Node'
  // Aggressively clean text for Mermaid compatibility
  let cleaned = text
    // Remove all markdown formatting
    .replace(/[*`_~]/g, '')
    // Remove all quotes (single and double)
    .replace(/["'`]/g, '')
    // Remove all brackets and parentheses
    .replace(/[<>{}[\]()]/g, '')
    // Remove colons and semicolons (can break parsing)
    .replace(/[:;]/g, '')
    // Replace newlines and multiple spaces with single space
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    // Remove leading/trailing dashes and spaces
    .trim()
    // Remove double dashes (Mermaid uses -- for edges)
    .replace(/--+/g, '-')
    // Remove leading/trailing dashes again after replacement
    .replace(/^-+|-+$/g, '')
  
  // Truncate if too long
  if (cleaned.length > MAX_LABEL_LENGTH) {
    cleaned = cleaned.slice(0, MAX_LABEL_LENGTH - 1).trim()
  }
  
  // Ensure we have something valid - if empty after cleaning, use default
  if (!cleaned || cleaned.length === 0) {
    return 'Node'
  }
  
  return cleaned
}

/**
 * Extracts heading level and text from a Markdown heading line
 * Returns { level: number, text: string } or null
 */
const parseHeading = (line) => {
  const trimmed = line.trim()
  const match = trimmed.match(/^(#{1,6})\s+(.+)$/)
  if (!match) return null
  return {
    level: match[1].length,
    text: match[2].trim(),
  }
}

/**
 * Extracts bullet point text, handling various bullet formats
 * Returns cleaned text or null
 */
const parseBullet = (line) => {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Match bullets: -, *, •, or numbered lists
  const bulletMatch = trimmed.match(/^[-*•●◦▪–—]\s+(.+)$/)
  if (bulletMatch) return bulletMatch[1].trim()

  // Match numbered lists: 1. 2. etc
  const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
  if (numberedMatch) return numberedMatch[1].trim()

  // Match indented content (2+ spaces)
  if (trimmed.match(/^\s{2,}/)) {
    return trimmed.replace(/^\s+/, '')
  }

  return null
}

/**
 * Main converter: transforms Markdown summary into Mermaid graph TD syntax
 *
 * Heuristics:
 * 1. Headings (##, ###) become parent nodes
 * 2. Bullets under headings become child nodes
 * 3. If no headings, chunks content into sections
 * 4. Limits total nodes and children per parent
 */
export const generateMermaidFromSummary = (summary, options = {}) => {
  const {
    orientation = 'TD', // TD (top-down) or LR (left-right)
    maxNodes = MAX_NODES,
    maxChildrenPerParent = MAX_CHILD_NODES_PER_PARENT,
  } = options

  if (!summary || !summary.trim()) {
    const graphType = orientation === 'LR' ? 'graph LR' : 'graph TD'
    return `${graphType}\n    Root["No content available"]`
  }

  const lines = summary.split('\n')
  const nodes = []
  const edges = []
  const nodeMap = new Map()
  let nodeCounter = 0

  // Track current parent node (heading)
  let currentParent = null
  let currentParentId = null

  // Create root node
  const rootId = 'root'
  const rootLabel = 'Lecture Overview'
  nodeMap.set(rootId, { id: rootId, label: rootLabel, level: 0 })
  nodes.push({ id: rootId, label: rootLabel })

  for (let i = 0; i < lines.length && nodes.length < maxNodes; i++) {
    const line = lines[i]
    const heading = parseHeading(line)

    if (heading) {
      // Found a heading -> create parent node
      const headingLevel = heading.level
      const headingText = sanitizeLabel(heading.text)

      if (!headingText) continue

      // Skip detailed sections - only include key concepts
      const lowerHeading = headingText.toLowerCase()
      if (
        lowerHeading.includes('example') ||
        lowerHeading.includes('walkthrough') ||
        lowerHeading.includes('implementation') ||
        lowerHeading.includes('code') ||
        lowerHeading.includes('detailed') ||
        lowerHeading.includes('step-by-step')
      ) {
        continue // Skip these sections
      }

      // Create safe ID - ensure it's unique and valid
      const baseId = sanitizeId(headingText, nodeCounter)
      // Ensure no double dashes when combining with counter
      const headingId = baseId.endsWith('-') 
        ? `${baseId}${nodeCounter}` 
        : `${baseId}-${nodeCounter}`
      nodeCounter++
      nodeMap.set(headingId, { id: headingId, label: headingText, level: headingLevel })

      // Connect to root or previous parent based on level
      if (headingLevel === 2 || !currentParent) {
        // Top-level heading -> connect to root
        edges.push(`${rootId} --> ${headingId}`)
        currentParent = headingId
        currentParentId = headingId
      } else if (headingLevel > 2 && currentParent) {
        // Sub-heading -> connect to current parent (but limit depth)
        if (nodes.length < maxNodes) {
          edges.push(`${currentParentId} --> ${headingId}`)
          currentParent = headingId
          currentParentId = headingId
        }
      }

      nodes.push({ id: headingId, label: headingText })
    } else {
      // Check for bullet points - but only include key concepts, skip examples/walkthroughs
      const bullet = parseBullet(line)
      if (bullet && currentParentId) {
        const bulletText = sanitizeLabel(bullet)
        if (!bulletText) continue

        // Skip detailed examples, walkthroughs, and implementation details
        const lowerText = bulletText.toLowerCase()
        if (
          lowerText.includes('example') ||
          lowerText.includes('walkthrough') ||
          lowerText.includes('implementation') ||
          lowerText.includes('code') ||
          lowerText.includes('step') ||
          lowerText.includes('push') ||
          lowerText.includes('pop') ||
          lowerText.includes('loading') ||
          lowerText.startsWith('start') ||
          lowerText.startsWith('use ')
        ) {
          continue // Skip these detailed items
        }

        // Count existing children for this parent
        const existingChildren = edges.filter((edge) => edge.includes(`--> ${currentParentId}`)).length
        if (existingChildren >= maxChildrenPerParent) continue

        // Create safe ID - ensure it's unique and valid
        const baseId = sanitizeId(bulletText, nodeCounter)
        // Ensure no double dashes when combining with counter
        const bulletId = baseId.endsWith('-') 
          ? `${baseId}${nodeCounter}` 
          : `${baseId}-${nodeCounter}`
        nodeCounter++
        nodeMap.set(bulletId, { id: bulletId, label: bulletText, level: 999 })

        edges.push(`${currentParentId} --> ${bulletId}`)
        nodes.push({ id: bulletId, label: bulletText })
      }
    }
  }

  // Fallback: if no headings found, chunk content into sections
  if (nodes.length === 1 && summary.trim()) {
    const chunks = summary
      .split(/\n\n+/)
      .filter((chunk) => chunk.trim().length > 20)
      .slice(0, 6)

    chunks.forEach((chunk, idx) => {
      if (nodes.length >= maxNodes) return

      const chunkText = sanitizeLabel(chunk.slice(0, 100))
      if (!chunkText) return

      const chunkId = `chunk-${idx}`
      edges.push(`${rootId} --> ${chunkId}`)
      nodes.push({ id: chunkId, label: chunkText })
    })
  }

  // Build Mermaid syntax
  const graphType = orientation === 'LR' ? 'graph LR' : 'graph TD'
  let mermaid = `${graphType}\n`

  // Add node definitions - ensure labels are safe for Mermaid
  nodes.forEach((node) => {
    const isRoot = node.id === rootId
    const isParent = nodeMap.get(node.id)?.level <= 2 && !isRoot
    
    // Validate and clean node ID - ensure it's safe
    let safeNodeId = node.id
      .replace(/[^a-z0-9-]/g, '') // Only allow lowercase, numbers, and hyphens
      .replace(/--+/g, '-') // Remove double dashes
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    
    // If ID becomes empty or invalid, use a fallback
    if (!safeNodeId || safeNodeId.length === 0) {
      safeNodeId = isRoot ? 'root' : `node${nodes.indexOf(node)}`
    }
    
    // Get already sanitized label (from sanitizeLabel function)
    let safeLabel = node.label
    
    // Double-check: remove any remaining problematic characters
    safeLabel = safeLabel
      .replace(/["'`]/g, '') // Remove any quotes
      .replace(/[<>{}[\]()]/g, '') // Remove brackets
      .replace(/[:;]/g, '') // Remove colons/semicolons
      .replace(/--+/g, '-') // Remove double dashes
      .replace(/\n/g, ' ') // Remove newlines
      .trim()
    
    // Ensure label is not empty
    if (!safeLabel || safeLabel.length === 0) {
      safeLabel = isRoot ? 'Root' : isParent ? 'Topic' : 'Item'
    }
    
    // Final cleanup: remove any remaining quotes
    const finalLabel = safeLabel.replace(/"/g, '').replace(/'/g, '')
    
    // Use square brackets for rectangular nodes
    mermaid += `    ${safeNodeId}["${finalLabel}"]:::${isRoot ? 'root' : isParent ? 'parent' : 'child'}\n`
  })

  // Add edges - ensure syntax is correct and node IDs are safe
  edges.forEach((edge) => {
    // Validate edge format: should be "source --> target"
    if (edge && edge.includes('-->')) {
      // Split edge into source and target
      const parts = edge.split('-->').map(part => part.trim())
      if (parts.length === 2) {
        // Clean each node ID
        const source = parts[0]
          .replace(/[^a-z0-9-]/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+|-+$/g, '')
        const target = parts[1]
          .replace(/[^a-z0-9-]/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        // Only add if both source and target are valid
        if (source && target && source.length > 0 && target.length > 0) {
          mermaid += `    ${source} --> ${target}\n`
        }
      }
    }
  })

  // Add CSS classes for styling (only if we have nodes)
  if (nodes.length > 0) {
    mermaid += `\n    classDef root fill:#0ea5e9,stroke:#0284c7,stroke-width:3px,color:#ffffff\n`
    mermaid += `    classDef parent fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#0f172a\n`
    mermaid += `    classDef child fill:#ffffff,stroke:#94a3b8,stroke-width:1px,color:#0f172a\n`
  }

  return mermaid.trim()
}

/**
 * Validates Mermaid syntax and returns error message if invalid
 */
export const validateMermaidSyntax = (mermaidCode) => {
  if (!mermaidCode || !mermaidCode.trim()) {
    return 'Mermaid code is empty'
  }

  // Basic syntax checks
  if (!mermaidCode.includes('graph')) {
    return 'Mermaid code must start with "graph TD" or "graph LR"'
  }

  // Check for balanced brackets
  const openBrackets = (mermaidCode.match(/\[/g) || []).length
  const closeBrackets = (mermaidCode.match(/\]/g) || []).length
  if (openBrackets !== closeBrackets) {
    return 'Unbalanced brackets in Mermaid syntax'
  }

  return null
}

