'use server'

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'models/gemini-2.0-flash',
  'models/gemini-1.5-flash',
  'models/gemini-pro',
].filter(Boolean)

const buildEndpoint = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`

const createPrompt = ({ transcript, lectureTitle }) => `You are NoteGenie, an AI assistant that converts lecture transcripts into
clean, structured study notes. Create approachable notes for students who may revisit
the material later.

Requirements:
- Write in Markdown with clear headings (##) and subheadings (###)
- Include bullet points for key ideas, definitions, and examples
- Highlight important formulas or terminology using **bold** text
- Add a short "Quick Recap" section at the top
- Add "Key Takeaways" and "Suggested Follow-up" sections at the end
- If the lecture switches between Hindi and English, keep content bilingual but make it readable
- Keep the tone concise and friendly

Transcript:${lectureTitle ? `\nLecture Title: ${lectureTitle}` : ''}
"""${transcript}"""`

const extractText = (responseJson) => {
  const parts =
    responseJson?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean) || []

  if (!parts.length) {
    throw new Error('Gemini API returned no text content. Check usage limits or API key permissions.')
  }

  return parts.join('\n\n')
}

const callGemini = async ({ apiKey, model, payload }) => {
  const response = await fetch(`${buildEndpoint(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    const message = errorPayload?.error?.message || response.statusText
    const error = new Error(message)
    error.status = response.status
    error.model = model
    throw error
  }

  return response.json()
}

export const summarizeTranscript = async ({ transcript, lectureTitle }) => {
  if (!transcript) {
    throw new Error('Transcript text is required for summarization.')
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to your environment variables.')
  }

  if (!MODEL_CANDIDATES.length) {
    throw new Error('No Gemini model candidates configured.')
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: createPrompt({ transcript, lectureTitle }) }],
      },
    ],
  }

  let lastError
  for (const model of MODEL_CANDIDATES) {
    try {
      const data = await callGemini({ apiKey, model, payload })
      return extractText(data)
    } catch (error) {
      lastError = error
      console.warn(`[gemini] model ${model} failed:`, error.message)
    }
  }

  throw new Error(
    `All Gemini model attempts failed. Last error (${lastError?.model || 'unknown model'}): ${lastError?.message}`
  )
}

