# HealthBridge AI 🏥

An intelligent, multilingual public health advisory assistant and RAG platform built for accessible healthcare awareness.

## 🌟 Key Features

- **Multilingual AI Health Guidance**: Native conversational support in English, Hindi, Bengali, Odia, and Telugu.
- **RAG Architecture**: Retrieval-Augmented Generation powered by ChromaDB knowledge bases (NHP India, symptom guides, vaccination data) and Google Gemini.
- **Multichannel Access**:
  - Web Application (Responsive interactive dashboard, symptom checker, disease awareness)
  - Telegram Bot Gateway (Direct fallback messaging with inline multilingual keyboards)
  - WhatsApp Integration Ready (Meta Cloud API / Webhook architecture)
- **Zero-Crash Safety Fallbacks**: Layered pre-check and post-check safety evaluation for red-flag medical emergencies and automated fallback responses during API rate limits.
- **Authentication & User Profile**: Supabase authentication with local caching for instant UI state restoration.

---

## 🏗️ System Architecture

1. **AI RAG Service (`ai_service/Health Bridge/`)**
   - **Port**: `5000`
   - **Tech**: FastAPI, ChromaDB, Gemini 3.6 Flash
   - **Role**: Vector semantic search, intent classification, and localized response synthesis.

2. **Backend Gateway (`backend/`)**
   - **Port**: `8000`
   - **Tech**: FastAPI, Uvicorn, HTTPX, Supabase Auth
   - **Role**: Central API hub, Telegram bot polling daemon, user auth, and webhook management.

3. **Frontend Client (`frontend/`)**
   - **Port**: `5173`
   - **Tech**: Vite, HTML5, Vanilla JavaScript, CSS3
   - **Role**: Responsive health dashboard, interactive chat assistant, and disease trackers.

---

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file in the project root with the following configuration:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Backend Settings
HOST=0.0.0.0
PORT=8000
AI_SERVICE_URL=http://localhost:5000/api/chat

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Supabase Credentials
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 2. Running the Services

**Terminal 1 — AI Service (Port 5000):**
```bash
cd "ai_service/Health Bridge"
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

**Terminal 2 — Backend Gateway (Port 8000):**
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — Frontend (Port 5173):**
```bash
cd frontend/react-app
npm run dev
```

---

## 🔒 Security Note
Never commit `.env` or sensitive API keys. Ensure `.gitignore` is active at all times.
