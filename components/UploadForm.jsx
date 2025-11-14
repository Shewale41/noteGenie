'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const createInitialSteps = () => [
  { label: 'Upload', status: 'idle' },
  { label: 'Transcribe', status: 'idle' },
  { label: 'Summarize', status: 'idle' },
]

const supportedExtensions = ['mp3', 'wav', 'mp4']

const formatDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date)

export default function UploadForm({ onSuccess }) {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [steps, setSteps] = useState(() => createInitialSteps())
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)

  const resetState = useCallback(() => {
    setSteps(createInitialSteps())
    setError(null)
    setIsProcessing(false)
    setResult(null)
    setSelectedFile(null)
  }, [])

  const updateStepStatus = useCallback((index, status) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    )
  }, [])

  const handleFile = useCallback((file) => {
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !supportedExtensions.includes(ext)) {
      setError('Unsupported file type. Please upload .mp3, .wav, or .mp4 files.')
      return
    }

    resetState()
    setSelectedFile(file)
  }, [resetState])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      setDragActive(false)
      const file = event.dataTransfer.files?.[0]
      handleFile(file)
    },
    [handleFile]
  )

  const onBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const onFileInputChange = (event) => {
    const file = event.target.files?.[0]
    handleFile(file)
  }

  const processLecture = useCallback(async () => {
    if (!selectedFile) {
      setError('Please choose a file first.')
      return
    }

    const parseErrorMessage = async (response, fallback) => {
      try {
        const data = await response.json()
        return data.error || fallback
      } catch (err) {
        console.error('Failed to parse error response', err)
        return fallback
      }
    }

    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      // Step 1: Upload
      updateStepStatus(0, 'loading')
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const message = await parseErrorMessage(
          uploadResponse,
          'Upload failed'
        )
        throw new Error(message)
      }

      const uploadData = await uploadResponse.json()
      updateStepStatus(0, 'complete')

      // Step 2: Transcribe
      updateStepStatus(1, 'loading')
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId: uploadData.lectureId,
          storageKey: uploadData.storageKey,
        }),
      })

      if (!transcribeResponse.ok) {
        const message = await parseErrorMessage(
          transcribeResponse,
          'Transcription failed'
        )
        throw new Error(message)
      }

      const transcriptionData = await transcribeResponse.json()
      updateStepStatus(1, 'complete')

      // Step 3: Summarize
      updateStepStatus(2, 'loading')
      const summarizeResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId: uploadData.lectureId,
          transcript: transcriptionData.transcript,
        }),
      })

      if (!summarizeResponse.ok) {
        const message = await parseErrorMessage(
          summarizeResponse,
          'Summarization failed'
        )
        throw new Error(message)
      }

      const summaryData = await summarizeResponse.json()
      updateStepStatus(2, 'complete')

      const timestamp = new Date()
      setResult({
        lectureId: uploadData.lectureId,
        summary: summaryData.summary,
        transcript: transcriptionData.transcript,
        completedAt: formatDate(timestamp),
      })

      router.refresh()
      
      // Close modal after a short delay if onSuccess callback is provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Processing failed. Please try again.')
      setSteps((prev) =>
        prev.map((step) =>
          step.status === 'loading' ? { ...step, status: 'error' } : step
        )
      )
    } finally {
      setIsProcessing(false)
    }
  }, [router, selectedFile, updateStepStatus, onSuccess])

  return (
    <div className="bg-white rounded-2xl p-8">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.mp4"
          onChange={onFileInputChange}
          className="hidden"
        />
        <p className="text-lg font-semibold text-gray-700">
          Drag & drop your lecture file here
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: .mp3, .wav, .mp4
        </p>
        <button
          type="button"
          onClick={onBrowseClick}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition cursor-pointer"
        >
          Browse Files
        </button>
        {selectedFile && (
          <p className="mt-4 text-sm text-gray-600">
            Selected: <span className="font-medium">{selectedFile.name}</span>
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              step.status === 'complete'
                ? 'border-green-200 bg-green-50 text-green-800'
                : step.status === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : step.status === 'loading'
                ? 'border-primary-200 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            <span className="font-medium">{step.label}</span>
            <span className="text-sm capitalize">{step.status}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={processLecture}
          disabled={!selectedFile || isProcessing}
          className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition ${
            !selectedFile || isProcessing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Process Lecture'}
        </button>
        <button
          type="button"
          onClick={resetState}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-6">
          <h3 className="text-lg font-semibold text-primary-800">
            Lecture processed successfully! 🎉
          </h3>
          <p className="text-sm text-primary-700 mt-1">
            Completed at {result.completedAt}
          </p>
          <div className="mt-4 space-y-3 text-sm text-primary-800">
            <p>
              <span className="font-semibold">Transcript Preview:</span>{' '}
              {result.transcript.slice(0, 200)}{result.transcript.length > 200 ? '…' : ''}
            </p>
            <p>
              <span className="font-semibold">Summary Preview:</span>{' '}
              {result.summary.slice(0, 200)}{result.summary.length > 200 ? '…' : ''}
            </p>
          </div>
          <a
            href={`/notes/${result.lectureId}`}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition cursor-pointer"
          >
            View Notes
          </a>
        </div>
      )}
    </div>
  )
}

