export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { generateQuizQuestions } from '@/lib/gemini'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lectureIdParam = searchParams.get('lectureId')

    const lectureId = lectureIdParam ? Number(lectureIdParam) : null
    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId query parameter is required.' }, { status: 400 })
    }

    const lectureResult = await query('SELECT id, title FROM lectures WHERE id = $1', [lectureId])
    if (!lectureResult.rowCount) {
      return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 })
    }

    const quizResult = await query(
      `SELECT id, lecture_id, question, options, correct_option, explanation, created_at
       FROM quizzes
       WHERE lecture_id = $1
       ORDER BY id`,
      [lectureId]
    )

    return NextResponse.json({
      success: true,
      lecture: lectureResult.rows[0],
      quiz: quizResult.rows,
    })
  } catch (error) {
    console.error('[quiz][GET] error', error)
    return NextResponse.json({ error: 'Failed to fetch quiz data.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const lectureId = Number(body.lectureId)
    const numQuestions = body.numQuestions || 6

    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId is required.' }, { status: 400 })
    }

    const lectureResult = await query('SELECT id, title FROM lectures WHERE id = $1', [lectureId])
    if (!lectureResult.rowCount) {
      return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 })
    }

    const notesResult = await query(
      `SELECT summary_text
       FROM notes
       WHERE lecture_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [lectureId]
    )

    if (!notesResult.rowCount) {
      return NextResponse.json(
        { error: 'Summary not found for this lecture. Generate notes before creating a quiz.' },
        { status: 400 }
      )
    }

    const summaryText = notesResult.rows[0].summary_text
    const lectureTitle = lectureResult.rows[0].title

    const questions = await generateQuizQuestions({
      summary: summaryText,
      lectureTitle,
      numQuestions,
    })

    const savedQuestions = await withTransaction(async (client) => {
      await client.query('DELETE FROM quizzes WHERE lecture_id = $1', [lectureId])

      const inserted = []
      for (const question of questions) {
        const insertedRow = await client.query(
          `INSERT INTO quizzes (lecture_id, question, options, correct_option, explanation)
           VALUES ($1, $2, $3::jsonb, $4, $5)
           RETURNING id, lecture_id, question, options, correct_option, explanation, created_at`,
          [
            lectureId,
            question.question,
            JSON.stringify(question.options || []),
            question.correctOption,
            question.explanation || null,
          ]
        )

        inserted.push(insertedRow.rows[0])
      }

      return inserted
    })

    return NextResponse.json({
      success: true,
      lecture: lectureResult.rows[0],
      quiz: savedQuestions,
    })
  } catch (error) {
    console.error('[quiz][POST] error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz questions.' },
      { status: 500 }
    )
  }
}
