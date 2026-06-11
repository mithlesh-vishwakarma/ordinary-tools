# YTGrab — YouTube Video Downloader

A modern, full-stack web application to download YouTube videos. Built with **React + TypeScript** frontend and **Python FastAPI** backend, powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp).

![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## ✨ Features

- 🎨 **Premium dark-mode UI** with glassmorphism design
- 🔍 **Fetch video info** — see thumbnail, title, channel, duration, views
- 📋 **Format picker** — browse all available formats with quality, type, and size info
- 🎛️ **Filter formats** — quickly filter by Combined / Video Only / Audio Only
- ⬇️ **One-click download** — select any format and download directly to your browser
- 📊 **Download progress** — real-time progress tracking
- 📱 **Fully responsive** — works on mobile, tablet, and desktop
- 🐳 **Docker ready** — deploy anywhere with one command

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** and **pip**
- **Node.js 18+** and **npm**
- **FFmpeg** (recommended, for merging high-quality video + audio)

### 1. Clone & Setup Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173` with API requests proxied to the backend.

---

## 🐳 Docker Deployment

Build and run everything with Docker Compose:

```bash
docker-compose up --build
```

The app will be available at `http://localhost` (port 80).

- Frontend (nginx): port **80**
- Backend (FastAPI): port **8000**

---

## 📁 Project Structure

```
ytvideoDownloader/
├── backend/                 # Python FastAPI backend
│   ├── main.py              # API endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile
│   └── downloads/           # Temp download directory
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx          # Main application
│   │   ├── index.css        # Design system
│   │   ├── components/      # UI components
│   │   ├── api/             # API client
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf           # Nginx config for production
│   └── package.json
├── docker-compose.yml       # Docker orchestration
├── ytvideoDownloader.py     # Original CLI script
└── README.md
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Health check |
| `POST` | `/api/video-info` | Fetch video metadata & formats |
| `POST` | `/api/download` | Download video in specified format |

### Example: Fetch Video Info

```bash
curl -X POST http://localhost:8000/api/video-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## 🌐 Deployment Options

| Platform | Notes |
|----------|-------|
| **Railway** | Deploy both services, set Backend internal URL as env var |
| **Render** | Use separate Web Services for frontend and backend |
| **DigitalOcean** | Deploy Docker Compose on a Droplet |
| **VPS** | Any Linux VPS with Docker installed |

> **Note:** Static hosting (Vercel, Netlify) won't work for the backend since it needs Python + FFmpeg.

---

## ⚠️ Disclaimer

This tool is for **educational purposes only**. Downloading copyrighted content without permission may violate YouTube's Terms of Service and applicable laws. Use responsibly.

---

## 📄 License

MIT
