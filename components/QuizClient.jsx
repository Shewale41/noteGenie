'use client'

import { useCallback, useMemo, useState } from 'react'

const normaliseQuestions = (questions = []) =>
  questions.map((question) => ({
    ...question,
    options: Array.isArray(question.options)
      ? question.options
      : Object.values(question.options || {}),
  }))

const initialSelections = (questions) =>
  questions.reduce((acc, question) => {
    acc[question.id] = ''
    return acc
  }, {})

export default function QuizClient({ lecture, initialQuiz = [] }) {
  const [questions, setQuestions] = useState(() => normaliseQuestions(initialQuiz))
  const [selectedOptions, setSelectedOptions] = useState(() => initialSelections(initialQuiz))
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const hasQuiz = questions.length > 0

  const handleSelect = useCallback((questionId, option) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: option }))
  }, [])

  const resetState = useCallback((newQuestions) => {
    setQuestions(normaliseQuestions(newQuestions))
    setSelectedOptions(initialSelections(newQuestions))
    setResult(null)
    setError(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: lecture.id, numQuestions: 6 }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Quiz generation failed.' }))
        throw new Error(payload.error || 'Quiz generation failed.')
      }

      const data = await response.json()
      resetState(data.quiz || [])
    } catch (err) {
      console.error('Failed to generate quiz', err)
      setError(err.message || 'Failed to generate quiz. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [lecture.id, resetState])

  const unansweredCount = useMemo(() => {
    if (!questions.length) return 0
    return questions.reduce((count, question) => {
      const selection = selectedOptions[question.id]
      return selection ? count : count + 1
    }, 0)
  }, [questions, selectedOptions])

  const handleSubmit = useCallback(async () => {
    try {
      if (!questions.length) return
      if (unansweredCount > 0) {
        setError(`Please answer all questions before submitting (${unansweredCount} remaining).`)
        return
      }

      setIsSubmitting(true)
      setError(null)

      const responses = questions.map((question) => ({
        quizId: question.id,
        selectedOption: selectedOptions[question.id],
      }))

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: lecture.id, responses }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Quiz submission failed.' }))
        throw new Error(payload.error || 'Quiz submission failed.')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error('Failed to submit quiz', err)
      setError(err.message || 'Failed to submit quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [lecture.id, questions, selectedOptions, unansweredCount])

  const handleReset = useCallback(() => {
    setSelectedOptions(initialSelections(questions))
    setResult(null)
    setError(null)
  }, [questions])

  const renderOptionState = useCallback(
    (question, option) => {
      const selected = selectedOptions[question.id]
      const breakdown = result?.breakdown?.find((item) => item.quizId === question.id)

      if (!breakdown) {
        return {
          isSelected: selected === option,
          status: 'idle',
        }
      }

      const isCorrectOption = breakdown.correctOption?.toLowerCase() === option.toLowerCase()
      const isSelectedOption = selected === option
      const isCorrectSelection = isSelectedOption && breakdown.isCorrect
      const isIncorrectSelection = isSelectedOption && !breakdown.isCorrect

      let status = 'neutral'
      if (isCorrectSelection) status = 'correct'
      else if (isIncorrectSelection) status = 'incorrect'
      else if (isCorrectOption) status = 'answer'

      return {
        isSelected: isSelectedOption,
        status,
      }
    },
    [result, selectedOptions]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{lecture.title || 'Lecture Quiz'}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Test your understanding with auto-generated questions based on your notes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium shadow ${
              isGenerating
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isGenerating ? 'Generating…' : hasQuiz ? 'Regenerate Quiz' : 'Generate Quiz'}
          </button>
          {hasQuiz && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium border border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600"
            >
              Reset Answers
            </button>
          )}
          {hasQuiz && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || unansweredCount > 0}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold shadow ${
                isSubmitting || unansweredCount > 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Answers'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!hasQuiz && !isGenerating && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p>No quiz available yet. Generate a fresh set of questions when you are ready to revise.</p>
        </div>
      )}

      {hasQuiz && (
        <div className="space-y-6">
          {questions.map((question, index) => {
            const breakdown = result?.breakdown?.find((item) => item.quizId === question.id)

            return (
              <div
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-6 w-6 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-4">
                    <p className="text-lg font-semibold text-slate-900">{question.question}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {question.options.map((option) => {
                        const { isSelected, status } = renderOptionState(question, option)

                        const statusClasses = {
                          idle: 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600',
                          neutral: 'border-slate-200 text-slate-600',
                          correct: 'border-emerald-300 bg-emerald-50 text-emerald-700',
                          incorrect: 'border-rose-300 bg-rose-50 text-rose-700',
                          answer: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                        }

                        const baseClasses = `w-full rounded-xl border px-4 py-3 text-left transition ${
                          statusClasses[status] || statusClasses.idle
                        } ${isSelected ? 'ring-2 ring-primary-400' : ''}`

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSelect(question.id, option)}
                            disabled={Boolean(result)}
                            className={baseClasses}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>

                    {breakdown?.explanation && (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <strong className="font-semibold">Explanation:</strong> {breakdown.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {result?.score && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
          <h2 className="text-lg font-semibold">Great effort!</h2>
          <p className="mt-1 text-sm">
            You answered {result.score.correct} out of {result.score.totalQuestions} questions correctly
            ({result.score.percentage}% score).
          </p>
        </div>
      )}
    </div>
  )
}
