import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import util from 'util'
import { ensureWav, deleteFileIfExists } from '@/lib/ffmpeg'
import { query } from '@/lib/db'

const execFileAsync = util.promisify(execFile)

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const body = await request.json()
    const { lectureId, storageKey, language, whisperModel = 'base' } = body

    if (!lectureId || !storageKey) {
      return NextResponse.json(
        { error: 'lectureId and storageKey are required.' },
        { status: 400 }
      )
    }

    const tempDir = path.join(process.cwd(), 'public', 'temp')
    const sourcePath = path.join(tempDir, storageKey)

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json(
        { error: 'Uploaded file could not be located on the server.' },
        { status: 404 }
      )
    }

    const { outputPath, tempGenerated } = await ensureWav(sourcePath)

    const pythonExecutable = process.env.PYTHON_PATH || 'python'
    const scriptPath = path.join(process.cwd(), 'whisper', 'transcribe.py')

    const args = [scriptPath, '--audio', outputPath, '--model', whisperModel]
    if (language) {
      args.push('--language', language)
    }

    const { stdout, stderr } = await execFileAsync(pythonExecutable, args, {
      maxBuffer: 1024 * 1024 * 50,
    })

    if (stderr) {
      console.warn('[transcribe] stderr:', stderr)
    }

    let result
    try {
      result = JSON.parse(stdout)
    } catch (error) {
      console.error('[transcribe] Failed to parse Whisper output', stdout)
      throw new Error('Unexpected Whisper output. See server logs for details.')
    }

    if (result.error) {
      throw new Error(result.error)
    }

    const transcriptText = result.text?.trim()

    if (!transcriptText) {
      throw new Error('Whisper did not return any transcript text.')
    }

    await query('DELETE FROM transcripts WHERE lecture_id = $1', [lectureId])

    const transcriptInsert = await query(
      'INSERT INTO transcripts (lecture_id, text) VALUES ($1, $2) RETURNING id',
      [lectureId, transcriptText]
    )

    if (tempGenerated) {
      deleteFileIfExists(outputPath)
    }

    return NextResponse.json({
      success: true,
      transcriptId: transcriptInsert.rows[0].id,
      transcript: transcriptText,
      language: result.language,
    })
  } catch (error) {
    console.error('[transcribe] error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio.' },
      { status: 500 },
    )
  }
}

