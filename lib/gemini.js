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

const buildQuizPrompt = ({ summary, lectureTitle, numQuestions }) => {
  const bounded = Math.min(Math.max(numQuestions || 6, 5), 10)
  return `You are NoteGenie, an AI teaching assistant. Generate ${bounded} multiple choice questions (MCQs)
that help students revise the lecture.

Return ONLY valid JSON that matches this schema exactly:
{
  "questions": [
    {
      "question": "<question text>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctOption": "<the exact option string that is correct>",
      "explanation": "<why the answer is correct>"
    }
  ]
}

Rules:
- Provide exactly ${bounded} questions.
- Each question must have 4 distinct options.
- Make the questions concise and based ONLY on the provided summary.
- Do not include any commentary outside of the JSON.

Lecture title: ${lectureTitle || 'Untitled Lecture'}
Lecture summary:
"""${summary}"""`
}

const parseQuizResponse = (raw) => {
  if (!raw) {
    throw new Error('Gemini returned an empty quiz response.')
  }

  if (raw.questions) {
    return raw.questions
  }

  const jsonPart = raw?.candidates?.[0]?.content?.parts?.find((part) => part.json)
  if (jsonPart?.json?.questions) {
    return jsonPart.json.questions
  }

  const textPart = raw?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text
  if (!textPart) {
    throw new Error('Gemini response did not contain quiz JSON text.')
  }

  let cleanedText = textPart.trim()

  const codeBlockMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
  if (codeBlockMatch) {
    cleanedText = codeBlockMatch[1]
  }

  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanedText = jsonMatch[0]
  }

  let parsed
  try {
    parsed = JSON.parse(cleanedText)
  } catch (error) {
    throw new Error(`Failed to parse quiz JSON produced by Gemini: ${error.message}`)
  }

  if (!parsed?.questions) {
    throw new Error('Quiz JSON is missing the questions field.')
  }

  return parsed.questions
}

const sanitiseQuestions = (questions = []) => {
  const toText = (value) => (typeof value === 'string' ? value.trim() : '')

  return questions
    .map((item, index) => {
      const questionText = toText(item.question)
      const explanation = toText(item.explanation)
      const options = Array.isArray(item.options)
        ? item.options
            .map(toText)
            .filter((option) => option.length)
            .slice(0, 4)
        : []

      if (!questionText || options.length < 3) {
        return null
      }

      let correct = toText(item.correctOption)
      if (!correct) {
        correct = options[0]
      }

      const matched = options.find((option) => option.toLowerCase() === correct.toLowerCase())
      const correctOption = matched || options[0]

      return {
        id: `generated-${index}`,
        question: questionText,
        options,
        correctOption,
        explanation,
      }
    })
    .filter(Boolean)
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

export const generateQuizQuestions = async ({ summary, lectureTitle, numQuestions = 6 }) => {
  if (!summary) {
    throw new Error('Summary text is required for quiz generation.')
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
        parts: [{ text: buildQuizPrompt({ summary, lectureTitle, numQuestions }) }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
    },
  }

  let lastError
  for (const model of MODEL_CANDIDATES) {
    try {
      const raw = await callGemini({ apiKey, model, payload })
      const parsed = parseQuizResponse(raw)
      const sanitised = sanitiseQuestions(parsed)

      if (!sanitised.length) {
        throw new Error('Gemini returned quiz items that could not be parsed.')
      }

      return sanitised
    } catch (error) {
      lastError = error
      console.warn(`[gemini][quiz] model ${model} failed:`, error.message)
    }
  }

  throw new Error(
    `Unable to generate quiz questions. Last error (${lastError?.model || 'unknown model'}): ${lastError?.message}`
  )
}

const buildFlashcardPrompt = ({ summary, lectureTitle, numCards }) => {
  const bounded = Math.min(Math.max(numCards || 8, 5), 15)
  return `You are NoteGenie, an AI study assistant. Generate ${bounded} Q/A-style flashcards to help students memorize key concepts from the lecture.

Return ONLY valid JSON that matches this schema exactly:
{
  "cards": [
    {
      "front": "<question or term to recall>",
      "back": "<answer or definition>"
    }
  ]
}

Rules:
- Provide exactly ${bounded} flashcards.
- Front should be a concise question, term, or concept name.
- Back should be a clear, brief answer or definition (2-3 sentences max).
- Focus on key definitions, important concepts, formulas, and critical facts.
- Make cards suitable for active recall practice.
- Do not include any commentary outside of the JSON.

Lecture title: ${lectureTitle || 'Untitled Lecture'}
Lecture summary:
"""${summary}"""`
}

const parseFlashcardResponse = (raw) => {
  if (!raw) {
    throw new Error('Gemini returned an empty flashcard response.')
  }

  if (raw.cards) {
    return raw.cards
  }

  const jsonPart = raw?.candidates?.[0]?.content?.parts?.find((part) => part.json)
  if (jsonPart?.json?.cards) {
    return jsonPart.json.cards
  }

  const textPart = raw?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text
  if (!textPart) {
    throw new Error('Gemini response did not contain flashcard JSON text.')
  }

  let cleanedText = textPart.trim()

  const codeBlockMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
  if (codeBlockMatch) {
    cleanedText = codeBlockMatch[1]
  }

  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanedText = jsonMatch[0]
  }

  let parsed
  try {
    parsed = JSON.parse(cleanedText)
  } catch (error) {
    throw new Error(`Failed to parse flashcard JSON produced by Gemini: ${error.message}`)
  }

  if (!parsed?.cards) {
    throw new Error('Flashcard JSON is missing the cards field.')
  }

  return parsed.cards
}

const sanitiseFlashcards = (cards = []) => {
  const toText = (value) => (typeof value === 'string' ? value.trim() : '')

  return cards
    .map((item, index) => {
      const front = toText(item.front)
      const back = toText(item.back)

      if (!front || !back) {
        return null
      }

      return {
        id: `generated-${index}`,
        front,
        back,
      }
    })
    .filter(Boolean)
}

export const generateFlashcards = async ({ summary, lectureTitle, numCards = 8 }) => {
  if (!summary) {
    throw new Error('Summary text is required for flashcard generation.')
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
        parts: [{ text: buildFlashcardPrompt({ summary, lectureTitle, numCards }) }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
    },
  }

  let lastError
  for (const model of MODEL_CANDIDATES) {
    try {
      const raw = await callGemini({ apiKey, model, payload })
      const parsed = parseFlashcardResponse(raw)
      const sanitised = sanitiseFlashcards(parsed)

      if (!sanitised.length) {
        throw new Error('Gemini returned flashcard items that could not be parsed.')
      }

      return sanitised
    } catch (error) {
      lastError = error
      console.warn(`[gemini][flashcards] model ${model} failed:`, error.message)
    }
  }

  throw new Error(
    `Unable to generate flashcards. Last error (${lastError?.model || 'unknown model'}): ${lastError?.message}`
  )
}

