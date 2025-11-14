import Link from 'next/link'
import { notFound } from 'next/navigation'
import NotesTabs from '@/components/NotesTabs'
import ExportPDFButton from '@/components/ExportPDFButton'
import { query } from '@/lib/db'

export default async function LectureNotesPage({ params }) {
  const lectureId = Number(params.id)

  if (Number.isNaN(lectureId)) {
    notFound()
  }

  const result = await query(
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

  if (!result.rowCount) {
    notFound()
  }

  const lecture = result.rows[0]

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-xs uppercase tracking-widest text-primary-600 font-semibold">
            NoteGenie
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-white/60 p-8" data-notes-content>
          <h1 className="text-3xl font-bold text-gray-900">
            {lecture.title || 'Untitled Lecture'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Processed on{' '}
            {new Date(lecture.created_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>

          {lecture.summary && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <ExportPDFButton lecture={lecture} summary={lecture.summary} transcript={lecture.transcript} />
              <Link
                href={`/quiz/${lecture.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
              >
                Practice Quiz →
              </Link>
              <Link
                href={`/qa/${lecture.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Ask Questions →
              </Link>
              <Link
                href={`/flashcards/${lecture.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
              >
                Flashcards →
              </Link>
            </div>
          )}

          <NotesTabs summary={lecture.summary} transcript={lecture.transcript} />
        </div>
      </div>
    </main>
  )
}
