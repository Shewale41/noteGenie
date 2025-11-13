'use client'

import { useCallback, useRef, useState } from 'react'

export default function QAChat({ lecture }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      const question = input.trim()
      if (!question || isLoading) return

      setError(null)
      setInput('')
      setIsLoading(true)

      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      scrollToBottom()

      try {
        const response = await fetch('/api/qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lectureId: lecture.id,
            question,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Request failed.' }))
          throw new Error(payload.error || 'Failed to get answer.')
        }

        const data = await response.json()

        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        scrollToBottom()
      } catch (err) {
        console.error('Q&A error', err)
        setError(err.message || 'Failed to get answer. Please try again.')

        const errorMessage = {
          id: Date.now() + 1,
          role: 'error',
          content: err.message || 'Failed to get answer.',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
        scrollToBottom()
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    [input, isLoading, lecture.id, scrollToBottom]
  )

  const handleClear = useCallback(() => {
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ask about this lecture</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Get instant answers based on your notes and transcript
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-sm space-y-3">
              <p className="text-slate-500">
                Ask any question about <strong>{lecture.title}</strong> and I'll answer based on the
                lecture content.
              </p>
              <p className="text-xs text-slate-400">
                Examples: "What are the key concepts?", "Explain the main process", "What are the
                advantages?"
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : message.role === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400"></span>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="border-t border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the lecture..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold shadow transition ${
              !input.trim() || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

