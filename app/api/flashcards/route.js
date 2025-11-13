export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { generateFlashcards } from '@/lib/gemini'

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

    let flashcards = []
    try {
      const flashcardResult = await query(
        `SELECT id, lecture_id, front_text, back_text, created_at
         FROM flashcards
         WHERE lecture_id = $1
         ORDER BY id`,
        [lectureId]
      )
      flashcards = flashcardResult.rows
    } catch (dbError) {
      if (dbError?.message?.includes('does not exist')) {
        console.error('[flashcards][GET] flashcards table missing. Run: node scripts/init-db.js')
        return NextResponse.json(
          {
            error: 'Database table missing. Please run: node scripts/init-db.js',
            flashcards: [],
          },
          { status: 503 }
        )
      }
      throw dbError
    }

    return NextResponse.json({
      success: true,
      lecture: lectureResult.rows[0],
      flashcards,
    })
  } catch (error) {
    console.error('[flashcards][GET] error', error)
    return NextResponse.json({ error: 'Failed to fetch flashcards.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const lectureId = Number(body.lectureId)
    const numCards = body.numCards || 8

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
        { error: 'Summary not found for this lecture. Generate notes before creating flashcards.' },
        { status: 400 }
      )
    }

    const summaryText = notesResult.rows[0].summary_text
    const lectureTitle = lectureResult.rows[0].title

    const cards = await generateFlashcards({
      summary: summaryText,
      lectureTitle,
      numCards,
    })

    let savedCards
    try {
      savedCards = await withTransaction(async (client) => {
        await client.query('DELETE FROM flashcards WHERE lecture_id = $1', [lectureId])

        const inserted = []
        for (const card of cards) {
          const insertedRow = await client.query(
            `INSERT INTO flashcards (lecture_id, front_text, back_text)
             VALUES ($1, $2, $3)
             RETURNING id, lecture_id, front_text, back_text, created_at`,
            [lectureId, card.front, card.back]
          )

          inserted.push(insertedRow.rows[0])
        }

        return inserted
      })
    } catch (dbError) {
      if (dbError?.message?.includes('does not exist')) {
        console.error('[flashcards][POST] flashcards table missing. Run: node scripts/init-db.js')
        return NextResponse.json(
          {
            error: 'Database table missing. Please run: node scripts/init-db.js',
          },
          { status: 503 }
        )
      }
      throw dbError
    }

    return NextResponse.json({
      success: true,
      lecture: lectureResult.rows[0],
      flashcards: savedCards,
    })
  } catch (error) {
    console.error('[flashcards][POST] error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards.' },
      { status: 500 }
    )
  }
}

