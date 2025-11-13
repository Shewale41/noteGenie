import Link from 'next/link'
import UploadForm from '@/components/UploadForm'
import LecturesList from '@/components/LecturesList'
import { query } from '@/lib/db'

export default async function Home() {
  let lectures = []

  try {
    const lecturesResult = await query(
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
    lectures = lecturesResult.rows
  } catch (error) {
    console.error('[home] failed to fetch lectures:', error?.message)
    // Non-fatal: show an empty dashboard so the app loads
    lectures = []
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <p className="text-sm uppercase tracking-widest text-primary-600 font-semibold">
            NoteGenie
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Turn Lectures into Smart, Visual Study Notes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload lecture recordings in Hindi or English, transcribe them with Whisper, and
            transform transcripts into clean, structured notes powered by Gemini.
          </p>
        </header>

        <section>
          <UploadForm />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recently Processed Lectures
            </h2>
            <span className="text-sm text-gray-500">
              {lectures.length} {lectures.length === 1 ? 'lecture' : 'lectures'}
            </span>
          </div>
          <LecturesList lectures={lectures} />
        </section>
      </div>
    </main>
  )
}

