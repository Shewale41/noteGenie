#!/usr/bin/env node

/* eslint-disable no-console */
const path = require('path')
const dotenv = require('dotenv')
const { Pool } = require('pg')

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please add it to your .env file.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
})

const createTablesQuery = `
CREATE TABLE IF NOT EXISTS lectures (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id SERIAL PRIMARY KEY,
  lecture_id INT REFERENCES lectures(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  lecture_id INT REFERENCES lectures(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  lecture_id INT REFERENCES lectures(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  lecture_id INT REFERENCES lectures(id) ON DELETE CASCADE,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  lecture_id INT REFERENCES lectures(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`

async function init() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(createTablesQuery)
    await client.query('COMMIT')
    console.log('✅ Database tables ensured. Ready to go!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Failed to initialize database:', error.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

init()

