import Link from 'next/link'

export default function LecturesList({ lectures = [] }) {
  if (!lectures.length) {
    return (
      <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-xl p-6">
        No processed lectures yet. Upload a file to get started!
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {lectures.map((lecture) => (
        <Link
          key={lecture.id}
          href={`/notes/${lecture.id}`}
          className="block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {lecture.title || 'Untitled Lecture'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(lecture.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-sm text-primary-600 font-medium">
              View Notes →
            </span>
          </div>
          {lecture.summary_preview && (
            <p className="mt-3 text-sm text-gray-600 overflow-hidden text-ellipsis">
              {lecture.summary_preview}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}
