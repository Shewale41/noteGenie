# 🎓 NoteGenie — AI-Powered Lecture Summarizer

**NoteGenie** is an AI-powered platform that helps students turn lectures into clean, structured, visual notes with smart study tools.

## ✨ Features

- 📹 **Upload & Process** - Upload lecture videos or audios (Hindi/English)
- 🎤 **Auto-Transcribe** - Transcribe using local Whisper
- 🤖 **AI Summarization** - Generate structured notes using Gemini API
- 💾 **Persistent Storage** - Store transcripts and summaries in Neon PostgreSQL
- 🗺️ **Mind Maps** - Visualize notes as Mermaid.js diagrams with export capabilities
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
- **Visualization**: Mermaid.js (diagrams), html-to-image (export)

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
- `GEMINI_MODEL` - (Optional) Override Gemini model, e.g. `models/gemini-2.0-flash`
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
│   ├── langchain.js
│   └── mermaid.js          → Mermaid diagram generator
├── components/
│   ├── MermaidMindMap.jsx   → Mermaid visualization component
│   └── ...
└── public/
    └── temp/
```

## 🔄 Development Phases

This project is being built in phases:

- ✅ **Phase 1**: Setup & Configuration
- ✅ **Phase 2**: Core MVP (Upload → Transcribe → Summarize → Store → Display)
- ✅ **Phase 3**: Mind Map Visualization (Mermaid.js)
- ✅ **Phase 4**: Quiz Generation & Storage
- ✅ **Phase 5**: Q&A Chat
- ✅ **Phase 6**: Flashcards Mode

## 📝 License

MIT

## 🗺️ Mind Map Features

The Mind Map tab uses **Mermaid.js** to convert lecture summaries into visual diagrams:

### Usage
1. Navigate to any lecture's notes page
2. Click the **"Mind Map"** tab
3. Click **"Generate Mind Map"** to auto-generate from summary
4. Click **"Render"** to display the diagram
5. Edit the Mermaid code directly if needed
6. Export as PNG or SVG for sharing

### Mermaid Diagram Features
- **Auto-generation**: Converts Markdown headings and bullets into graph nodes
- **Editable**: Modify the Mermaid code directly in the textarea
- **Orientation**: Toggle between Top-Down (TD) and Left-Right (LR) layouts
- **Export**: Download diagrams as PNG or SVG images
- **Copy**: Copy Mermaid code to clipboard for use in other tools

### Parsing Heuristics
The converter (`lib/mermaid.js`) uses deterministic rules:
- **Headings** (`##`, `###`) → Parent nodes
- **Bullet points** (`-`, `*`) → Child nodes
- **Long text** → Automatically truncated for readability
- **Fallback**: If no headings found, chunks content into sections

### Sample Summaries
Demo summaries are available in `public/sample-summaries/`:
- `data-structures.md` - Example with clear headings and bullets
- `ai-fundamentals.md` - Example with multiple sections

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

