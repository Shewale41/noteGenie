import { Pool } from 'pg'

let cachedPool

const buildPool = () =>
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    allowExitOnIdle: true,
  })

if (!globalThis._noteGeniePool) {
  cachedPool = buildPool()
  globalThis._noteGeniePool = cachedPool
} else {
  cachedPool = globalThis._noteGeniePool
}

export const pool = cachedPool

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const query = async (text, params, { retries = 2 } = {}) => {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await pool.query(text, params)
    } catch (error) {
      lastError = error
      const transient =
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        /timeout|reset|closed/i.test(error?.message || '')

      if (!transient || attempt === retries) {
        throw error
      }

      const backoffMs = 500 * (attempt + 1)
      await sleep(backoffMs)
    }
  }
  throw lastError
}

export const withTransaction = async (callback) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

