import { NextResponse } from 'next/server'
import { query } from '../../../lib/db.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lectureId = searchParams.get('lectureId')

    if (lectureId) {
      const lectureResult = await query(
        `SELECT
          l.id,
          l.title,
          l.created_at,
          (
            SELECT text FROM transcripts t
            WHERE t.lecture_id = l.id
            ORDER BY t.id DESC
            LIMIT 1
          ) AS transcript,
          (
            SELECT summary_text FROM notes n
            WHERE n.lecture_id = l.id
            ORDER BY n.id DESC
            LIMIT 1
          ) AS summary
        FROM lectures l
        WHERE l.id = $1`,
        [lectureId]
      )

      if (!lectureResult.rowCount) {
        return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 })
      }

      return NextResponse.json({ success: true, lecture: lectureResult.rows[0] })
    }

    const listResult = await query(
      `SELECT
        l.id,
        l.title,
        l.created_at,
        (
          SELECT summary_text FROM notes n
          WHERE n.lecture_id = l.id
          ORDER BY n.id DESC
          LIMIT 1
        ) AS summary_preview
      FROM lectures l
      ORDER BY l.created_at DESC`
    )

    return NextResponse.json({ success: true, lectures: listResult.rows })
  } catch (error) {
    console.error('[notes][GET] error', error)
    return NextResponse.json(
      { error: 'Failed to fetch lectures and notes.' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { lectureId, summaryText } = body

    if (!lectureId || !summaryText) {
      return NextResponse.json(
        { error: 'lectureId and summaryText are required.' },
        { status: 400 }
      )
    }

    await query('DELETE FROM notes WHERE lecture_id = $1', [lectureId])

    const result = await query(
      'INSERT INTO notes (lecture_id, summary_text) VALUES ($1, $2) RETURNING id',
      [lectureId, summaryText]
    )

    return NextResponse.json({ success: true, noteId: result.rows[0].id })
  } catch (error) {
    console.error('[notes][POST] error', error)
    return NextResponse.json(
      { error: 'Failed to store notes.' },
      { status: 500 }
    )
  }
}

