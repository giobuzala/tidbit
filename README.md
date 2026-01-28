# [tidbit](https://tidbit.pages.dev/)

An AI-powered chatbot for summarizing news articles and extracting key topics.

## Overview

tidbit is a chat-based web application for quickly digesting news articles using OpenAI's GPT-4.1 model.

It is designed for readers, researchers, and media analysts who want to extract essential information from articles without reading them in full, while preserving the original headline and key themes.

The interface supports multiple input formats: paste a URL, drop in a PDF or Word document, or copy-paste the article text directly. Each input returns a structured summary with five keywords.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| AI | OpenAI GPT-4.1 via ChatKit |
| Hosting | Cloudflare Pages (frontend), Render (backend) |

## Quick Start

```bash
# Install dependencies
npm install

# Set your OpenAI API key
cp .env.example .env.local
# Edit .env.local with your OPENAI_API_KEY

# Run both frontend and backend
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `VITE_CHATKIT_API_URL` | No | Backend URL (defaults to `/chatkit`) |
| `VITE_CHATKIT_API_DOMAIN_KEY` | No | ChatKit domain key (defaults to localhost dev key) |

## Deployment

### Backend (Render)

1. Create a Web Service on Render
2. Set root directory to `backend`
3. Build command: `pip install -e .`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add `OPENAI_API_KEY` environment variable

### Frontend (Cloudflare Pages)

1. Create a Pages project from your repo
2. Set root directory to `frontend`
3. Build command: `npm install && npm run build`
4. Output directory: `dist`
5. Add environment variables:
   - `VITE_CHATKIT_API_URL` → your Render backend URL + `/chatkit`
   - `VITE_CHATKIT_API_DOMAIN_KEY` → from [OpenAI Domain Allowlist](https://platform.openai.com/settings/organization/security/domain-allowlist)

## Project Structure

```
tidbit/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatKitPanel.tsx
│   │   ├── lib/
│   │   │   ├── config.ts
│   │   │   └── session.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── package.json
├── backend/           # FastAPI server
│   ├── app/
│   │   ├── main.py
│   │   ├── server.py
│   │   └── memory_store.py
│   └── pyproject.toml
├── .env.example
└── package.json       # Root scripts
```

## License

MIT
