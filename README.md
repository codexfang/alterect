# Alterect

Alterect is a Git-for-construction-drawings platform that automatically detects changes between blueprint revisions, alerts affected trades, and predicts rework costs. Upload a PDF and it laser-compares every wall, outlet, duct, and dimension — so nothing slips between revisions.

## Features

- **Smart Diff Engine** — pixel-level comparison between drawing revisions, classifying every change by type (added, removed, modified, relocated)
- **Trade Alerts** — automatically notifies the right team (electrical, structural, plumbing, HVAC) when changes affect their scope
- **Risk Scoring** — predicts cost impact and conflict probability based on change patterns
- **Language Query** — ask "what changed on floor 2?" or "show me high-severity electrical changes" in plain English
- **OAuth Integrations** — connect Dropbox to auto-ingest drawings and Slack to receive change alerts
- **Revision Timeline** — full version history for every drawing sheet

## Usage

1. **Upload a drawing** — PDF, PNG, or DWF. Alterect parses the sheet name, revision, and metadata.
2. **Upload a new revision** — the diff engine compares it against the previous version pixel by pixel.
3. **Review changes** — every addition, removal, and relocation is surfaced with coordinates, trade tags, and severity.
4. **Get alerts** — affected trades are notified via Slack or in-app, with risk scores and cost estimates.
5. **Ask questions** — use natural language to query changes across your project.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, SQLite (dev) / Supabase (prod)
- **Auth**: Supabase (email/password)
- **Integrations**: Dropbox OAuth, Slack OAuth
- **Design**: "Soft dawn on a marble dashboard" — Ink, Fog, Rust, Signifier/Inter

## Live

- **Frontend**: https://codexfang.github.io/alterect/
- **Backend**: https://alterect-api.onrender.com

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
