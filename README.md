# 🎓 NoteGenie — AI-Powered Lecture Summarizer

**NoteGenie** is an AI-powered platform that helps students turn lectures into clean, structured, visual notes with smart study tools.

## ✨ Features

- 📹 **Upload & Process** - Upload lecture videos or audios (Hindi/English)
- 🎤 **Auto-Transcribe** - Transcribe using local Whisper
- 🤖 **AI Summarization** - Generate structured notes using Gemini API
- 💾 **Persistent Storage** - Store transcripts and summaries in Neon PostgreSQL
- 🗺️ **Mind Maps** - Visualize notes as interactive topic mind maps
- 📝 **Quiz Generator** - Auto-generate quizzes from notes with results tracking
- 💬 **Q&A Chat** - Ask contextual questions about your notes
- 🧠 **Flashcards** - Generate Q/A flashcards for self-revision

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Speech-to-Text**: Whisper (local installation)
- **AI Summarization**: Gemini API
- **Database**: Neon PostgreSQL
- **Media Processing**: FFmpeg
- **Visualization**: React Flow

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Python** (v3.8 or higher) with `openai-whisper` installed
3. **FFmpeg** installed and available in PATH
4. **Gemini API Key** from Google AI Studio
5. **Neon PostgreSQL** database URL

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
pip install openai-whisper
```

### 3. Verify FFmpeg Installation

```bash
ffmpeg -version
```

If not installed, download from [FFmpeg Official Site](https://ffmpeg.org/download.html)

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:
- `GEMINI_API_KEY` - Your Gemini API key from Google AI Studio
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `LOCAL_WHISPER_PATH` - (Optional) Path to Whisper if not in PATH
- `PYTHON_PATH` - (Optional) Path to Python executable if not in PATH

### 5. Initialize Database

Run the database initialization script (will be created in Phase 2):

```bash
node scripts/init-db.js
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
note-genie/
├── app/
│   ├── page.jsx                 → Upload page
│   ├── notes/[id]/page.jsx      → Notes viewer
│   ├── quiz/[id]/page.jsx       → Quiz page
│   ├── qa/[id]/page.jsx         → Q&A page
│   ├── flashcards/[id]/page.jsx → Flashcard view
│   └── api/
│       ├── upload/route.js
│       ├── transcribe/route.js
│       ├── summarize/route.js
│       ├── notes/route.js
│       ├── quiz/route.js
│       ├── quiz/submit/route.js
│       └── qa/route.js
├── whisper/
│   └── transcribe.py
├── lib/
│   ├── db.js
│   ├── gemini.js
│   ├── ffmpeg.js
│   └── langchain.js
└── public/
    └── temp/
```

## 🔄 Development Phases

This project is being built in phases:

- ✅ **Phase 1**: Setup & Configuration
- ⏳ **Phase 2**: Core MVP (Upload → Transcribe → Summarize → Store → Display)
- ⏳ **Phase 3**: Mind Map Visualization
- ⏳ **Phase 4**: Quiz Generation & Storage
- ⏳ **Phase 5**: Q&A Chat
- ⏳ **Phase 6**: Flashcards Mode

## 📝 License

MIT

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

