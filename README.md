# Alterect

Alterect is a Git-for-construction-drawings platform that automatically detects changes between blueprint revisions, alerts affected trades, and predicts rework costs. Upload a PDF and it laser-compares every wall, outlet, duct, and dimension — so nothing slips between revisions.

## Features

- **Smart Diff Engine** — pixel-level comparison between drawing revisions, classifying every change by type
- **Trade Alerts** — automatically notifies the right team (electrical, structural, plumbing, HVAC) when changes affect their scope
- **Risk Scoring** — predicts cost impact and conflict probability based on change patterns
- **Language Query** — ask "what changed on floor 2?" in plain English
- **OAuth Integrations** — connect Dropbox to auto-ingest drawings and Slack to receive change alerts
- **Revision Timeline** — full version history for every drawing sheet

## Usage

1. **Upload a drawing** — PDF, PNG, or DWF. Alterect parses the sheet name, revision, and metadata.
2. **Upload a new revision** — the diff engine compares it against the previous version.
3. **Review changes** — every addition, removal, and relocation is surfaced with coordinates, trade tags, and severity.
4. **Get alerts** — affected trades are notified via Slack or in-app.
5. **Ask questions** — use natural language to query changes across your project.

## Live

- **Frontend**: https://codexfang.github.io/alterect/
- **Backend**: https://alterect-api.onrender.com

## Project Structure

```
├── frontend/          # React + Vite (deployed to GitHub Pages)
├── backend/           # FastAPI (deployed to Render)
│   ├── api/          # Routes (main + OAuth)
│   ├── core/         # Config, database, auth
│   ├── models/       # SQLAlchemy models
│   └── services/     # PDF parsing, diff engine
├── supabase-schema.sql
└── .github/workflows/
```

## Local Development

```bash
# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173

# Backend
cd backend
cp .env.example .env
./venv/bin/uvicorn app.main:app --reload --port 8000
```

## Deployment

- **Frontend**: Push to `main` → GitHub Actions builds and deploys to GitHub Pages
- **Backend**: Connected to Render — auto-deploys from `main`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, SQLite (dev) / Supabase (prod)
- **Auth**: Supabase (email/password)
- **Integrations**: Dropbox OAuth, Slack OAuth
- **Design**: "Soft dawn on a marble dashboard" — Ink, Fog, Rust, Signifier/Inter
