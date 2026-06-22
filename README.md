# Alterect

Git for construction drawings — automatically detect changes between blueprint revisions, alert affected trades, and predict rework costs.

## Live

- **Frontend**: https://codexfang.github.io/alterect/
- **Backend**: https://alterect-api.onrender.com

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, SQLite (dev) / Supabase (prod)
- **Auth**: Supabase (email/password)
- **Integrations**: Dropbox OAuth, Slack OAuth
- **Design**: "Soft dawn on a marble dashboard" — Ink, Fog, Rust, Signifier/Inter

## Project Structure

```
├── frontend/          # React + Vite (deployed to GitHub Pages)
├── backend/           # FastAPI (deployed to Render)
│   ├── app/
│   │   ├── api/       # Routes (main + OAuth)
│   │   ├── core/      # Config, database, auth
│   │   ├── models/    # SQLAlchemy models
│   │   └── services/  # PDF parsing, diff engine, ML
│   └── data/          # SQLite database (dev)
├── supabase-schema.sql
└── .github/workflows/ # CI/CD
```

## Local Development

```bash
# Frontend
cd frontend
cp .env.example .env    # Add your Supabase & Groq keys
npm install
npm run dev             # http://localhost:5173

# Backend
cd backend
cp .env.example .env    # Add OAuth credentials
./venv/bin/uvicorn app.main:app --reload --port 8000
```

### OAuth Setup

For Dropbox and Slack integrations, register OAuth apps and set redirect URIs:

| Provider | Redirect URI |
|---|---|
| Dropbox | `http://localhost:8000/api/oauth/dropbox/callback` |
| Slack | `http://localhost:8000/api/oauth/slack/callback` |

For production, replace `localhost:8000` with your deployed backend URL.

## Deployment

- **Frontend**: Push to `main` → GitHub Actions builds and deploys to GitHub Pages
- **Backend**: Connected to Render — auto-deploys from `main`

### Environment Variables

**Frontend** (`frontend/.env`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `VITE_GROQ_API_KEY` — Groq API key for AI chat

**Backend** (`backend/.env`):
- `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET`
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`
- `OAUTH_REDIRECT_BASE` — Backend URL for OAuth callbacks
- `FRONTEND_URL` — Deployed frontend URL
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — For user ID matching

## License

MIT
