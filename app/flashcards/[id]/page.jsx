import Link from 'next/link'
import { notFound } from 'next/navigation'
import FlashcardDeck from '@/components/FlashcardDeck'
import { query } from '@/lib/db'

export default async function LectureFlashcardsPage({ params }) {
  const lectureId = Number(params.id)
  if (!Number.isInteger(lectureId)) {
    notFound()
  }

  let lecture
  let flashcards = []

  try {
    const lectureResult = await query(
      'SELECT id, title FROM lectures WHERE id = $1',
      [lectureId]
    )

    if (!lectureResult.rowCount) {
      notFound()
    }

    lecture = lectureResult.rows[0]

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
      console.error('[flashcards][page] failed to fetch flashcards:', dbError?.message)
      flashcards = []
    }
  } catch (error) {
    console.error('[flashcards][page] failed to fetch lecture:', error?.message)
    notFound()
  }

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
            NoteGenie Flashcards
          </span>
        </div>

        <FlashcardDeck lecture={lecture} initialFlashcards={flashcards} />
      </div>
    </main>
  )
}

