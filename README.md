# Motion3D AI Studio

1. `npm install`
2. `cp .env.example .env` and set `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey)
3. `npm start` and open http://localhost:3000

The key lives only in `.env` on the server; the browser calls `/api/generate`, never Gemini directly.
Deploy to any Node host (Render, Railway, Fly.io) and set the same env vars there.

## Deploy on Render (free)
Push this folder to GitHub (do not upload .env), then on render.com choose New > Blueprint, pick the repo, paste your GEMINI_API_KEY when asked, and deploy.
