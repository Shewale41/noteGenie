'use server'

import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const MODEL_CANDIDATES = [
  process.env.GEMINI_QA_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-pro',
].filter(Boolean)

const createModel = (modelName, apiKey) =>
  new ChatGoogleGenerativeAI({
    modelName,
    temperature: 0.3,
    maxOutputTokens: 1024,
    apiKey,
  })

const buildSystemPrompt = ({ lectureTitle, summary, transcript }) => {
  const parts = []

  parts.push(
    `You are NoteGenie, an AI study assistant helping students understand their lecture content.`
  )

  if (lectureTitle) {
    parts.push(`\nLecture Title: ${lectureTitle}`)
  }

  if (summary) {
    parts.push(`\n\n## Lecture Summary:\n${summary}`)
  }

  if (transcript) {
    parts.push(`\n\n## Full Transcript (for reference):\n${transcript}`)
  }

  parts.push(
    `\n\n## Instructions:
- Answer questions based ONLY on the lecture content provided above.
- If the question cannot be answered from the lecture, politely say so.
- Be concise, clear, and helpful.
- Use examples from the lecture when relevant.
- If the lecture content is in Hindi or English, respond in the same language as the question.`
  )

  return parts.join('')
}

export const answerQuestion = async ({ question, lectureTitle, summary, transcript }) => {
  if (!question?.trim()) {
    throw new Error('Question text is required.')
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to your environment variables.')
  }

  if (!MODEL_CANDIDATES.length) {
    throw new Error('No Gemini model candidates configured for Q&A.')
  }

  const systemPrompt = buildSystemPrompt({ lectureTitle, summary, transcript })
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(question.trim()),
  ]

  let lastError
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = createModel(modelName, apiKey)
      const response = await model.invoke(messages)
      const answer = typeof response.content === 'string' ? response.content : String(response.content)

      return answer.trim()
    } catch (error) {
      lastError = error
      console.warn(`[langchain][qa] model ${modelName} failed:`, error.message)
    }
  }

  throw new Error(
    `Unable to generate answer. Last error (${lastError?.message || 'unknown'}): ${lastError?.message || 'All models failed'}`
  )
}

