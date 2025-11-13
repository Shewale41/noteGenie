import Link from 'next/link'
import { notFound } from 'next/navigation'
import QAChat from '@/components/QAChat'
import { query } from '@/lib/db'

export default async function LectureQAPage({ params }) {
  const lectureId = Number(params.id)
  if (!Number.isInteger(lectureId)) {
    notFound()
  }

  const lectureResult = await query(
    'SELECT id, title FROM lectures WHERE id = $1',
    [lectureId]
  )

  if (!lectureResult.rowCount) {
    notFound()
  }

  const lecture = lectureResult.rows[0]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100 py-16 px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/notes/${lecture.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to Notes
          </Link>
          <span className="text-xs uppercase tracking-widest text-primary-600 font-semibold">
            NoteGenie Q&A
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lecture.title || 'Lecture Q&A'}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Ask questions and get instant answers based on your lecture notes
            </p>
          </div>

          <QAChat lecture={lecture} />
        </div>
      </div>
    </main>
  )
}

