import Link from 'next/link'
import { notFound } from 'next/navigation'
import NotesTabs from '@/components/NotesTabs'
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

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-white/60 p-8">
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

          <NotesTabs summary={lecture.summary} transcript={lecture.transcript} />
        </div>
      </div>
    </main>
  )
}
