# ChatKit Starter

Minimal Vite + React UI paired with a FastAPI backend that forwards chat
requests to OpenAI through the ChatKit server library.

## Quick start

```bash
npm install
npm run dev
```

What happens:

- `npm run dev` starts the FastAPI backend on `127.0.0.1:8000` and the Vite
  frontend on `127.0.0.1:3000` with a proxy at `/chatkit`.

## Required environment

- `OPENAI_API_KEY` (backend)
- `VITE_CHATKIT_API_URL` (optional, defaults to `/chatkit`)
- `VITE_CHATKIT_API_DOMAIN_KEY` (optional, defaults to `domain_pk_localhost_dev`)

Set `OPENAI_API_KEY` in your shell or in `.env.local` at the repo root before
running the backend. Register a production domain key in the OpenAI dashboard
and set `VITE_CHATKIT_API_DOMAIN_KEY` when deploying.

## Deploy (Render + Cloudflare Pages)

This repo is set up to deploy as:

- **Backend**: Render (FastAPI) → serves `POST /chatkit`
- **Frontend**: Cloudflare Pages (Vite build) → serves the React app

### 1) Backend on Render

Create a **Web Service** on Render:

- **Root Directory**: `backend`
- **Build Command**: `pip install -e .`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Env vars**:
  - `OPENAI_API_KEY=...`

After deploy you’ll have a backend URL like `https://<your-service>.onrender.com`.
Your ChatKit endpoint will be:

- `https://<your-service>.onrender.com/chatkit`

Note: Render’s free tier may sleep on inactivity, so the first request can be slow.

### 2) Frontend on Cloudflare Pages

Create a **Pages** project from your Git repo:

- **Framework preset**: React (Vite)
- **Root directory**: `frontend`
- **Build command**: `npm install && npm run build`
- **Build output directory**: `dist`

Set these **Environment variables** in Cloudflare Pages:

- `VITE_CHATKIT_API_URL=https://<your-service>.onrender.com/chatkit`
- `VITE_CHATKIT_API_DOMAIN_KEY=domain_pk_...`

### 3) Domain allowlist (required for ChatKit UI)

ChatKit requires domain verification in production. Once Cloudflare gives you a URL
like `https://<your-project>.pages.dev`:

1. Add `<your-project>.pages.dev` to the OpenAI **Domain allowlist**.
2. Copy the generated `domain_pk_...` key.
3. Paste it into Cloudflare Pages as `VITE_CHATKIT_API_DOMAIN_KEY` and redeploy.

## Customize

- Update UI and connection settings in `frontend/src/lib/config.ts`.
- Adjust layout in `frontend/src/components/ChatKitPanel.tsx`.
- Swap the in-memory store in `backend/app/server.py` for persistence.
