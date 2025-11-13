const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const CATEGORY_DEFINITIONS = [
  {
    id: 'quick-recap',
    title: 'Quick Recap',
    headingAliases: ['quick recap', 'recap', 'overview', 'summary', 'at a glance'],
    textHints: ['recap', 'summary', 'overall'],
    fallbackLimit: 2,
  },
  {
    id: 'key-concepts',
    title: 'Key Concepts',
    headingAliases: ['key concepts', 'core concepts', 'key ideas', 'key points', 'concepts'],
    textHints: ['concept', 'idea', 'definition', 'principle'],
    fallbackLimit: 4,
  },
  {
    id: 'structures',
    title: 'Structures & Connections',
    headingAliases: ['relationships', 'connections', 'structure', 'trees', 'graphs', 'linkages'],
    textHints: ['relationship', 'connected', 'link', 'works with', 'depends on'],
    fallbackLimit: 3,
  },
  {
    id: 'components',
    title: 'Main Components',
    headingAliases: ['components', 'modules', 'parts', 'building blocks'],
    textHints: ['component', 'module', 'part', 'element', 'layer'],
    fallbackLimit: 3,
  },
  {
    id: 'processes',
    title: 'Processes & Workflows',
    headingAliases: ['process', 'workflow', 'steps', 'how it works', 'procedures'],
    textHints: ['process', 'step', 'workflow', 'sequence', 'procedure', 'algorithm'],
    fallbackLimit: 3,
  },
  {
    id: 'examples',
    title: 'Examples',
    headingAliases: ['examples', 'use cases', 'scenarios', 'case study'],
    textHints: ['example', 'for instance', 'use case', 'scenario'],
    fallbackLimit: 3,
  },
  {
    id: 'advantages',
    title: 'Advantages',
    headingAliases: ['advantages', 'benefits', 'strengths', 'pros'],
    textHints: ['advantage', 'benefit', 'strength', 'pro'],
    fallbackLimit: 3,
  },
  {
    id: 'disadvantages',
    title: 'Disadvantages',
    headingAliases: ['disadvantages', 'limitations', 'challenges', 'cons'],
    textHints: ['disadvantage', 'limitation', 'drawback', 'weakness', 'con'],
    fallbackLimit: 3,
  },
  {
    id: 'follow-up',
    title: 'Suggested Follow-up',
    headingAliases: ['suggested follow-up', 'next steps', 'further study', 'revision tips'],
    textHints: ['review', 'practice', 'next', 'follow-up', 'further'],
    fallbackLimit: 2,
  },
  {
    id: 'key-takeaways',
    title: 'Key Takeaways',
    headingAliases: ['key takeaways', 'highlights'],
    textHints: ['takeaway', 'remember', 'highlight'],
    fallbackLimit: 3,
  },
  {
    id: 'extra-notes',
    title: 'Additional Notes',
    headingAliases: ['additional notes', 'miscellaneous', 'notes'],
    textHints: [],
    fallbackLimit: 3,
  },
]

const MAX_ITEMS_PER_CATEGORY = 5
const MAX_TOTAL_NODES = 60

const normalise = (value = '') =>
  value
    .toLowerCase()
    .replace(/[*`_]/g, '')
    .replace(/:+$/, '')
    .trim()

const stripBullet = (line = '') =>
  line
    .replace(/^[-*•●◦▪–—]+\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^>\s*/, '')
    .trim()

const truncate = (text, limit = 110) => {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= limit) return clean
  return `${clean.slice(0, limit - 1)}…`
}

const splitHeading = (rawLine) => {
  const line = rawLine.trim()
  const hashMatch = line.match(/^#+\s*(.+)$/)
  if (hashMatch) {
    return { title: hashMatch[1].trim(), remainder: '' }
  }

  const boldMatch = line.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)
  if (boldMatch) {
    return { title: boldMatch[1].trim(), remainder: boldMatch[2].trim() }
  }

  const colonMatch = line.match(/^([A-Za-z][^:]{2,}):\s*(.*)$/)
  if (colonMatch) {
    return { title: colonMatch[1].trim(), remainder: colonMatch[2].trim() }
  }

  return null
}

const findCategoryByHeading = (heading) => {
  const normalised = normalise(heading)
  return CATEGORY_DEFINITIONS.find((definition) =>
    definition.headingAliases?.some((alias) => normalised.includes(normalise(alias)))
  )
}

const findCategoryByText = (text) => {
  const n = normalise(text)
  return CATEGORY_DEFINITIONS.find((definition) =>
    definition.textHints?.some((hint) => n.includes(normalise(hint)))
  )
}

const ensureSection = (collection, definition) => {
  if (!collection[definition.id]) {
    collection[definition.id] = { ...definition, items: [] }
  }
  return collection[definition.id]
}

const pushUnique = (items, value) => {
  if (!value) return
  const clean = truncate(value)
  if (!clean) return
  if (!items.some((item) => item === clean)) {
    items.push(clean)
  }
}

const extractSections = (summary) => {
  const lines = summary.split('\n')
  const sections = {}
  const unassigned = []
  let currentSection = null

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim()
    if (!trimmed) return

    const heading = splitHeading(trimmed)
    if (heading) {
      const category = findCategoryByHeading(heading.title)
      if (category) {
        currentSection = ensureSection(sections, category)
        if (heading.remainder) {
          pushUnique(currentSection.items, stripBullet(heading.remainder))
        }
        return
      }

      currentSection = ensureSection(sections, {
        id: `custom-${slugify(heading.title)}`,
        title: heading.title,
        headingAliases: [],
        textHints: [],
        fallbackLimit: 3,
      })
      if (heading.remainder) {
        pushUnique(currentSection.items, stripBullet(heading.remainder))
      }
      return
    }

    const bullet = stripBullet(trimmed)
    if (!bullet) return

    if (currentSection) {
      pushUnique(currentSection.items, bullet)
    } else {
      unassigned.push(bullet)
    }
  })

  unassigned.forEach((text) => {
    const category = findCategoryByText(text) || CATEGORY_DEFINITIONS[1]
    const target = ensureSection(sections, category)
    pushUnique(target.items, text)
  })

  const orderedSections = CATEGORY_DEFINITIONS.filter(Boolean)
  orderedSections.forEach((definition) => {
    const section = sections[definition.id]
    if (!section || section.items.length) return

    const pool = Object.values(sections)
      .flatMap((entry) => entry.items)
      .slice(0, definition.fallbackLimit)

    pool.forEach((text) => {
      pushUnique(section.items, text)
    })
  })

  return Object.values(sections)
    .filter((section) => section.items.length)
    .sort((a, b) => {
      const indexA = CATEGORY_DEFINITIONS.findIndex((definition) => definition.id === a.id)
      const indexB = CATEGORY_DEFINITIONS.findIndex((definition) => definition.id === b.id)
      return indexA - indexB
    })
}

const buildHierarchy = (summary) => {
  const root = {
    id: 'root',
    label: 'Lecture Overview',
    depth: 0,
    children: [],
  }

  const sections = extractSections(summary)
  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0)
  if (!totalItems) {
    const fallbackSentences = summary
      .split(/\.(?![^()]*\))/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 6)

    if (!fallbackSentences.length) {
      return root
    }

    sections.push({
      id: 'key-insights',
      title: 'Key Insights',
      items: fallbackSentences,
    })
  }

  sections.forEach((section) => {
    const sectionNode = {
      id: section.id,
      label: section.title,
      depth: 1,
      children: [],
    }

    section.items.slice(0, MAX_ITEMS_PER_CATEGORY).forEach((item, index) => {
      sectionNode.children.push({
        id: `${section.id}-${index}`,
        label: item,
        depth: 2,
        children: [],
      })
    })

    if (sectionNode.children.length) {
      root.children.push(sectionNode)
    }
  })

  return root
}

const flattenHierarchy = (root) => {
  const nodes = []
  const edges = []
  const spacingX = 280
  const spacingY = 140
  let order = 0

  const traverse = (node, parent = null) => {
    if (nodes.length >= MAX_TOTAL_NODES) return

    const id = node.id || `node-${order}`
    const depth = node.depth || 0
    const label = truncate(node.label)

    nodes.push({
      id,
      data: { label },
      position: {
        x: depth * spacingX,
        y: order * spacingY,
      },
      style: {
        padding: 12,
        width: depth === 1 ? 220 : 260,
        borderRadius: 12,
        border: '1px solid #cbd5f5',
        background: depth === 0 ? '#0ea5e9' : depth === 1 ? '#e0f2fe' : '#ffffff',
        color: depth === 0 ? '#ffffff' : '#0f172a',
        fontWeight: depth <= 1 ? 600 : 500,
        fontSize: depth === 0 ? 16 : 13,
        lineHeight: 1.4,
      },
      draggable: false,
      selectable: false,
    })

    if (parent) {
      edges.push({
        id: `e-${parent.id}-${id}`,
        source: parent.id,
        target: id,
        type: 'smoothstep',
        animated: depth === 2,
        markerEnd: { type: 'arrowclosed', color: '#0284c7' },
        style: { stroke: '#94a3b8', strokeWidth: 1.4 },
      })
    }

    const startOrder = order
    node.children.forEach((child) => {
      order += 1
      traverse(child, node)
    })

    if (order === startOrder) {
      order += 1
    }
  }

  traverse(root)
  return { nodes, edges }
}

export const buildMindMapGraph = (summary) => {
  const trimmed = (summary || '').trim()
  if (!trimmed) {
    return { nodes: [], edges: [] }
  }

  const tree = buildHierarchy(trimmed)
  return flattenHierarchy(tree)
}
