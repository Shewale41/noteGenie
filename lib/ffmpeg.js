import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const allowedAudioExtensions = ['.wav', '.mp3', '.m4a']

const ensureFfmpegPath = () => {
  const customPath = process.env.FFMPEG_PATH
  if (customPath) {
    ffmpeg.setFfmpegPath(customPath)
  }
}

export const ensureWav = (inputPath) => {
  const ext = path.extname(inputPath).toLowerCase()
  if (ext === '.wav') {
    return Promise.resolve({ outputPath: inputPath, tempGenerated: false })
  }

  ensureFfmpegPath()

  return new Promise((resolve, reject) => {
    const { name, dir } = path.parse(inputPath)
    const outputPath = path.join(dir, `${name}-${Date.now()}.wav`)

    ffmpeg(inputPath)
      .toFormat('wav')
      .audioCodec('pcm_s16le')
      .on('end', () => {
        resolve({ outputPath, tempGenerated: true })
      })
      .on('error', (error) => {
        reject(error)
      })
      .save(outputPath)
  })
}

export const deleteFileIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Failed to delete file', filePath, error)
  }
}

export const isSupportedMedia = (fileName) => {
  const ext = path.extname(fileName).toLowerCase()
  return ['.mp3', '.wav', '.mp4', '.m4a', '.aac', '.flac'].includes(ext)
}


