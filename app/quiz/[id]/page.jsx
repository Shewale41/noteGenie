import Link from 'next/link'
import { notFound } from 'next/navigation'
import QuizClient from '@/components/QuizClient'
import { query } from '@/lib/db'

export default async function LectureQuizPage({ params }) {
  const lectureId = Number(params.id)
  if (!Number.isInteger(lectureId)) {
    notFound()
  }

  const lectureResult = await query('SELECT id, title FROM lectures WHERE id = $1', [lectureId])
  if (!lectureResult.rowCount) {
    notFound()
  }

  const quizResult = await query(
    `SELECT id, lecture_id, question, options, correct_option, explanation, created_at
     FROM quizzes
     WHERE lecture_id = $1
     ORDER BY id`,
    [lectureId]
  )

  const lecture = lectureResult.rows[0]
  const quiz = quizResult.rows

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
            NoteGenie Quiz Mode
          </span>
        </div>

        <QuizClient lecture={lecture} initialQuiz={quiz} />
      </div>
    </main>
  )
}
