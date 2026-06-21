# Alterect

**Git for construction drawings.** Automatically detect changes between blueprint revisions, alert affected trades, and predict rework costs.

## Overview

Alterect is the single source of truth for construction drawing revisions. GCs, subcontractors, and architects upload PDF drawings (or integrate via Dropbox/Procore). The system automatically detects every change, classifies by trade, sends targeted alerts, and predicts impact costs.

## Architecture

```
alterect-platform/
├── frontend/          # React 18 + TypeScript + Tailwind CSS v4 + Framer Motion
├── backend/           # FastAPI + PostgreSQL + Redis + Celery
├── ml/                # Change detection & symbol classification
└── docker-compose.yml # Local development environment
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose (for PostgreSQL + Redis)

### 1. Clone and install

```bash
git clone https://github.com/alterect/platform.git
cd alterect-platform
```

### 2. Start infrastructure

```bash
docker compose up db redis -d
```

### 3. Backend

```bash
cd backend
cp ../.env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 5. Full stack (Docker)

```bash
docker compose up --build
```

## API Documentation

Once the backend is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| POST | `/api/drawings/upload` | Upload PDF drawing |
| POST | `/api/drawings/diff` | Compare two drawings |
| GET | `/api/drawings/{id}/timeline` | Version history |
| GET | `/api/drawings/{id}/changes` | Filtered changes |
| POST | `/api/alerts/subscribe` | Subscribe to trade alerts |
| POST | `/api/query/natural` | AI natural language query |
| POST | `/api/webhooks/procore` | Procore integration |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts, TanStack React Query, Lucide React
- **Backend:** FastAPI, SQLAlchemy (async), PostgreSQL, Redis, Celery
- **AI:** GPT-4o-mini, OpenCV, Vision Transformer (planned)
- **Auth:** JWT with bcrypt
- **Storage:** S3-compatible (Cloudflare R2 / AWS S3)

## Design System

"Soft dawn on a marble dashboard" — calm, editorial, confident.

- **Colors:** Ink, Fog, Ash, Graphite, Dove, Rust, Apricot Wash, Sky Wash
- **Typography:** Signifier/Inter (body), Merriweather (headline substitute)
- **Radius:** Cards 24px, buttons 9999px, inputs 16px
- **Shadows:** Single `--shadow-subtle` token used consistently

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

See `.env.example` for all variables.

## Deployment

- Frontend: Vercel/Netlify (`alterect.com`)
- Backend: Railway/Render (`api.alterect.com`)
- Database: Supabase
- Storage: Cloudflare R2

## License

MIT — see LICENSE file for details.

---

Built by the Alterect team. hello@alterect.com
