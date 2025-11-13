export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'

export async function POST(request) {
  try {
    const body = await request.json()
    const lectureId = Number(body.lectureId)
    const responses = Array.isArray(body.responses) ? body.responses : []

    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId is required.' }, { status: 400 })
    }

    if (!responses.length) {
      return NextResponse.json({ error: 'At least one quiz response is required.' }, { status: 400 })
    }

    const lectureResult = await query('SELECT id FROM lectures WHERE id = $1', [lectureId])
    if (!lectureResult.rowCount) {
      return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 })
    }

    const quizIds = responses
      .map((response) => Number(response.quizId))
      .filter((quizId) => Number.isInteger(quizId))

    if (!quizIds.length) {
      return NextResponse.json({ error: 'responses must include quizId values.' }, { status: 400 })
    }

    const quizResult = await query(
      `SELECT id, question, correct_option, explanation
       FROM quizzes
       WHERE lecture_id = $1 AND id = ANY($2::int[])`,
      [lectureId, quizIds]
    )

    const quizMap = new Map(quizResult.rows.map((row) => [row.id, row]))

    const graded = responses.map((response) => {
      const quizId = Number(response.quizId)
      const selectedOption = typeof response.selectedOption === 'string' ? response.selectedOption.trim() : ''
      const quiz = quizMap.get(quizId)

      if (!quiz) {
        return {
          quizId,
          question: null,
          selectedOption,
          correctOption: null,
          isCorrect: false,
        }
      }

      const isCorrect =
        selectedOption && selectedOption.toLowerCase() === quiz.correct_option.toLowerCase()

      return {
        quizId,
        question: quiz.question,
        selectedOption,
        correctOption: quiz.correct_option,
        explanation: quiz.explanation,
        isCorrect,
      }
    })

    const { correctCount } = await withTransaction(async (client) => {
      await client.query('DELETE FROM quiz_results WHERE lecture_id = $1', [lectureId])

      let correctTally = 0
      for (const item of graded) {
        if (item.isCorrect) {
          correctTally += 1
        }

        if (!item.quizId) {
          continue
        }

        await client.query(
          `INSERT INTO quiz_results (lecture_id, quiz_id, selected_option, is_correct)
           VALUES ($1, $2, $3, $4)`,
          [lectureId, item.quizId, item.selectedOption || null, item.isCorrect]
        )
      }

      return { correctCount: correctTally }
    })

    const totalQuestions = graded.length
    const score = {
      totalQuestions,
      correct: correctCount,
      percentage: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
    }

    return NextResponse.json({ success: true, score, breakdown: graded })
  } catch (error) {
    console.error('[quiz/submit][POST] error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz results.' },
      { status: 500 }
    )
  }
}
