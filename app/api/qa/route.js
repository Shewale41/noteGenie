export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { answerQuestion } from '@/lib/langchain'

export async function POST(request) {
  try {
    const body = await request.json()
    const lectureId = Number(body.lectureId)
    const question = body.question

    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId is required.' }, { status: 400 })
    }

    if (!question?.trim()) {
      return NextResponse.json({ error: 'question is required.' }, { status: 400 })
    }

    const lectureResult = await query(
      `SELECT
        l.id,
        l.title,
        (
          SELECT summary_text FROM notes n
          WHERE n.lecture_id = l.id
          ORDER BY n.id DESC
          LIMIT 1
        ) AS summary,
        (
          SELECT text FROM transcripts t
          WHERE t.lecture_id = l.id
          ORDER BY t.id DESC
          LIMIT 1
        ) AS transcript
      FROM lectures l
      WHERE l.id = $1`,
      [lectureId]
    )

    if (!lectureResult.rowCount) {
      return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 })
    }

    const lecture = lectureResult.rows[0]

    if (!lecture.summary && !lecture.transcript) {
      return NextResponse.json(
        { error: 'No notes or transcript available for this lecture. Please process the lecture first.' },
        { status: 400 }
      )
    }

    const answer = await answerQuestion({
      question: question.trim(),
      lectureTitle: lecture.title,
      summary: lecture.summary || null,
      transcript: lecture.transcript || null,
    })

    return NextResponse.json({
      success: true,
      question: question.trim(),
      answer,
      lecture: {
        id: lecture.id,
        title: lecture.title,
      },
    })
  } catch (error) {
    console.error('[qa][POST] error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate answer. Please try again.' },
      { status: 500 }
    )
  }
}

