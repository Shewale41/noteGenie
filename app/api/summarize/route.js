import { NextResponse } from 'next/server'
import { summarizeTranscript } from '@/lib/gemini'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { lectureId, transcript } = body

    if (!lectureId) {
      return NextResponse.json(
        { error: 'lectureId is required.' },
        { status: 400 }
      )
    }

    let transcriptText = transcript

    if (!transcriptText) {
      const transcriptResult = await query(
        'SELECT text FROM transcripts WHERE lecture_id = $1 ORDER BY id DESC LIMIT 1',
        [lectureId]
      )

      if (!transcriptResult.rowCount) {
        return NextResponse.json(
          { error: 'Transcript not found. Please transcribe the lecture first.' },
          { status: 404 }
        )
      }

      transcriptText = transcriptResult.rows[0].text
    }

    const lectureResult = await query('SELECT title FROM lectures WHERE id = $1', [lectureId])
    const lectureTitle = lectureResult.rows[0]?.title

    const summaryText = await summarizeTranscript({
      transcript: transcriptText,
      lectureTitle,
    })

    await query('DELETE FROM notes WHERE lecture_id = $1', [lectureId])

    const noteInsert = await query(
      'INSERT INTO notes (lecture_id, summary_text) VALUES ($1, $2) RETURNING id',
      [lectureId, summaryText]
    )

    return NextResponse.json({
      success: true,
      noteId: noteInsert.rows[0].id,
      summary: summaryText,
    })
  } catch (error) {
    console.error('[summarize] error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to summarize transcript.' },
      { status: 500 }
    )
  }
}

