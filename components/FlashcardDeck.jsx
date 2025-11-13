'use client'

import { useCallback, useState } from 'react'

export default function FlashcardDeck({ lecture, initialFlashcards = [] }) {
  const [flashcards, setFlashcards] = useState(initialFlashcards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const hasCards = flashcards.length > 0
  const currentCard = hasCards ? flashcards[currentIndex] : null

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: lecture.id, numCards: 10 }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Flashcard generation failed.' }))
        const errorMessage = payload.error || 'Flashcard generation failed.'
        
        if (errorMessage.includes('table missing') || errorMessage.includes('does not exist')) {
          throw new Error('Database setup required. Please run: node scripts/init-db.js')
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setFlashcards(data.flashcards || [])
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (err) {
      console.error('Failed to generate flashcards', err)
      setError(err.message || 'Failed to generate flashcards. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [lecture.id])

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, flashcards.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const handleShuffle = useCallback(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [flashcards])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{lecture.title || 'Lecture Flashcards'}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review key concepts with interactive flashcards
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium shadow transition ${
              isGenerating
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isGenerating ? 'Generating…' : hasCards ? 'Regenerate Cards' : 'Generate Flashcards'}
          </button>
          {hasCards && (
            <button
              type="button"
              onClick={handleShuffle}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium border border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600"
            >
              Shuffle
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!hasCards && !isGenerating && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p>No flashcards available yet. Generate a fresh set to start reviewing.</p>
        </div>
      )}

      {hasCards && currentCard && (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-sm text-slate-500">
            Card {currentIndex + 1} of {flashcards.length}
          </div>

          <div
            className="relative w-full max-w-2xl h-[400px] cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={handleFlip}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              <div
                className="absolute inset-0 w-full h-full rounded-2xl shadow-xl border border-slate-200 bg-white p-8 flex items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-slate-400 mb-4">Question</div>
                  <p className="text-2xl font-semibold text-slate-900 leading-relaxed">
                    {currentCard.front_text}
                  </p>
                </div>
              </div>

              <div
                className="absolute inset-0 w-full h-full rounded-2xl shadow-xl border border-primary-200 bg-primary-50 p-8 flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-primary-600 mb-4">Answer</div>
                  <p className="text-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {currentCard.back_text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className="rounded-lg px-6 py-2 font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow"
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                currentIndex === flashcards.length - 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

