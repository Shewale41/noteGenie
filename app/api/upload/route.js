import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    const supportedExtensions = ['mp3', 'wav', 'mp4', 'm4a']
    if (!extension || !supportedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .mp3, .wav, or .mp4 files.' },
        { status: 415 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const tempDir = path.join(process.cwd(), 'public', 'temp')
    await fs.promises.mkdir(tempDir, { recursive: true })

    const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/gi, '-').replace(/-+/g, '-')
    const fileName = `${Date.now()}-${cleanName}`
    const filePath = path.join(tempDir, fileName)

    await fs.promises.writeFile(filePath, buffer)

    const inferredTitle =
      formData.get('title') ||
      file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim()

    let lectureId
    try {
      const lectureResult = await query(
        'INSERT INTO lectures (title) VALUES ($1) RETURNING id',
        [inferredTitle || 'Untitled Lecture'],
        { retries: 3 }
      )
      lectureId = lectureResult.rows[0].id
    } catch (dbError) {
      console.error('[upload][db] failed to insert lecture:', dbError)
      return NextResponse.json(
        {
          error:
            'Database connection problem while creating lecture. Please check DATABASE_URL and network. Try again in a moment.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      lectureId,
      storageKey: fileName,
      originalName: file.name,
    })
  } catch (error) {
    console.error('[upload] error', error)
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    )
  }
}

