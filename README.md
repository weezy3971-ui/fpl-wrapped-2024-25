# FPL Wrapped 2024/25 ⚽

A personal **Fantasy Premier League season wrap-up** web app — your FPL stats presented in a slick, Instagram Stories-style format.

## Features

- 📊 Full season stats: points, rank, best/worst gameweeks
- 🏆 MVP & runner-up player cards
- 💎 Diamond Hands — your most loyal players
- 🔄 Transfer report: best move & biggest regret
- 📍 Captaincy analysis & chip usage breakdown
- 🎯 Tactical DNA (Template vs Maverick)
- 🟢🔴 Green & red arrow tracker
- 📸 Shareable story cards

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** — build tooling
- **Recharts** — data visualisation
- **Supabase Edge Functions** — server-side FPL API proxy (no CORS issues)

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```
VITE_SUPABASE_PROXY_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/fpl-proxy
GEMINI_API_KEY=your_key_here
```

## Deployment

Works on **any platform** (Vercel, Netlify, Cloudflare Pages, etc.).  
The Supabase Edge Function handles all FPL API proxying server-side.

Set `VITE_SUPABASE_PROXY_URL` in your hosting platform's environment variables dashboard.
