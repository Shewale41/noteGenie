import LandingPage from '@/components/LandingPage'
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
    lectures = []
  }

  return (
    <>
      {/* Landing Page with Beautiful Marketing Sections */}
      <LandingPage />

      {/* App Section - Seamlessly Integrated with Landing Page */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Your Lectures
          </h2>
          <LecturesList lectures={lectures} />
        </div>
      </section>
    </>
  )
}