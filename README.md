# worklog.ai

AI-powered daily work tracker. Type what you did in plain language — Gemini structures it into clean summaries, generates your standup update, writes brag sheet bullets, and tracks your logging streak.

## Features

- **New Log** — type freely, AI structures into summary + project + type tag with live preview
- **Timeline** — full history with search, filter by project/type/date range, inline edit
- **Daily Standup** — one-click standup generation from any date's logs, ready to paste into Slack or Teams
- **Brag Sheet** — resume-ready accomplishment bullets filtered by date range and project
- **Stats** — activity heatmap, streak tracker, weekly AI summary, breakdown by project and type
- **Data** — JSON/CSV export, JSON import with deduplication, bulk delete

## Tech Stack

- **Next.js 16** (App Router, React 19)
- **Supabase** (Postgres, service role client)
- **NextAuth v5** (JWT sessions, Google OAuth)
- **Google Gemini** `gemini-2.0-flash-lite` via `@google/generative-ai`
- **Zustand** for client state
- **Tailwind CSS v4**

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd worklog
npm install
```

### 2. Supabase

Create a project at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor. This creates the `logs` table, indexes, RLS policies, and the `updated_at` trigger.

### 3. Google OAuth

Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

### 4. Gemini API key

Get a free key at [aistudio.google.com](https://aistudio.google.com). The app works without it — keyword-based fallback inference runs when the key is absent.

### 5. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

GEMINI_API_KEY=AIza...

AUTH_SECRET=<random 32+ char string>
AUTH_URL=http://localhost:3000

AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub and import in Vercel
2. Set all env vars from `.env.local` in Vercel project settings
3. Set `AUTH_URL` to your production domain
4. Add the production callback URL to Google OAuth: `https://yourdomain.com/api/auth/callback/google`

## How it works

The app uses the service role Supabase client (bypasses RLS) with application-level `user_id` filtering on every query. Google OAuth `sub` is stored as the `user_id`. All AI generation falls back gracefully to keyword inference when `GEMINI_API_KEY` is not set.

Draft auto-saves to `localStorage`. Prompt style preference persists across sessions. The "What's next" field carries forward to the next day's standup as a reminder.
