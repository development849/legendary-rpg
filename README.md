# Legendary RPG

An AI-powered online roleplaying game where a Large Language Model acts as the Game Master in real time. Players interact through a web interface; the LLM handles everything a human GM would — narrative, NPC voices, dice adjudication, world consistency, and adaptive storytelling.

**Live:** https://legendaryrpg.co.uk  
**Owner:** Stan — development@leapcoaching.co.uk

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS, Wouter routing, TanStack Query |
| Backend | Node.js + Express, SSE for GM streaming |
| Database | PostgreSQL + Drizzle ORM |
| GM AI | OpenAI GPT-4o (streaming) |
| Image AI | Google Gemini (`gemini-2.0-flash-preview-image-generation`) |
| Auth | Passport.js + bcrypt, httpOnly cookies (`legendaryrpg.sid`) |

---

## Folder Structure

```
legendary-rpg-code/
├── client/                   ← React frontend
│   └── src/
│       ├── components/       ← Shared UI components
│       ├── hooks/            ← Custom hooks (useAuth, useWebSocket …)
│       ├── lib/              ← Utility functions, queryClient
│       └── pages/            ← Route pages (dashboard, game-session, etc.)
├── server/                   ← Node/Express backend
│   ├── gmOrchestrator.ts     ← GM logic, system prompt, image generation (2,600+ lines)
│   ├── gameEngine.ts         ← Dice mechanics, stat calculations
│   ├── index.ts              ← Express app, middleware, all routes
│   └── storage.ts            ← Database access layer (Drizzle)
├── shared/                   ← Shared TypeScript types
│   ├── schema.ts             ← Drizzle DB schema (campaigns, characters, sessions, …)
│   └── models/               ← Shared type definitions
├── migrations/               ← Drizzle database migrations
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Environment Variables

All secrets are stored as Replit Secrets (never in code). Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express-session signing secret (httpOnly cookie auth) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI GPT-4o API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI API base URL |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Google Gemini image generation key |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini API base URL |

---

## Local Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start dev server (frontend + backend)
npm run dev
```

The app runs at `http://localhost:5000` by default.

---

## Deploy

Deployment is via GitHub → Replit auto-deploy:

1. Make changes in this folder (direct file editing)
2. `git push` from this folder
3. Replit pulls from GitHub and redeploys automatically

**No manual Replit steps required after `git push`.**

---

## Key Files

- `server/gmOrchestrator.ts` — The GM brain. System prompt construction, GPT-4o streaming, state update parsing, scene mood, NPC register, image generation triggers. Central file — touch carefully.
- `server/index.ts` — All Express routes, auth middleware, WebSocket setup.
- `client/src/pages/game-session.tsx` — Main gameplay UI. Chronicle scroll, chat input, dice animations, character sidebar, scene background.
- `client/src/pages/create-character.tsx` — Character creation flow (Role → Origin → Attributes → Portrait).
- `shared/schema.ts` — Single source of truth for all DB tables and their TypeScript types.

---

## Architecture Notes

- **SSE streaming:** GM responses are streamed token-by-token via Server-Sent Events. The client consumes the stream and appends to the Chronicle in real time.
- **State updates:** The GM embeds structured JSON (`proposed_updates`) in its response for mechanical changes (HP, gold, inventory, XP). The server parses and applies these after the stream closes.
- **Solo-first:** Multiplayer infrastructure exists in the codebase but is hidden from the UI (marked `Phase 4 — multiplayer reactivation`). The OOC tab, party lobby, and invite UI are all gated.
- **httpOnly cookies:** Session auth uses `legendaryrpg.sid` (SameSite=none, Secure). No tokens in localStorage.

---

## Agent System (Project Management)

This project is developed using an AI Orchestrator + agent team running out of `/Users/stansmacmini/Documents/Claude/Projects/Legendary RPG/`. Sprint files, backlog, and agent role definitions live there. See `CLAUDE.md` in that folder for session setup.
