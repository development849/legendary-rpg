# Mythweave — AI-Powered Fantasy RPG

## Overview
Mythweave is an online fantasy RPG where an AI Game Master (powered by GPT-4o) runs real-time campaigns. Players create persistent characters, join parties via invite codes, and interact through natural language. The GM handles dice rolls, state updates, and narrative arcs using the "Mythweave Lite" custom d20 ruleset.

## Architecture

**Stack:** TypeScript, React, Express, PostgreSQL, Drizzle ORM, WebSockets, OpenAI GPT-4o

**Frontend:** React + Wouter routing, TanStack Query, Radix UI / shadcn
**Backend:** Express with SSE streaming GM responses, WebSocket for party sync

## Key Files

### Frontend Pages
- `client/src/pages/landing.tsx` — Marketing/landing with CTAs to auth page
- `client/src/pages/auth.tsx` — Registration/Login: tabbed form with email/password + Replit OAuth option
- `client/src/pages/dashboard.tsx` — Main hub: character list, active parties, join party
- `client/src/pages/create-character.tsx` — 4-step character creation (class → race → details → confirm)
- `client/src/pages/create-campaign.tsx` — Campaign creation with GM pacing settings
- `client/src/pages/lobby.tsx` — Party lobby with invite codes, ready states
- `client/src/pages/game-session.tsx` — Main game: streaming GM chat, quick actions, character panel
- `client/src/pages/character-sheet.tsx` — Character stats, HP, XP, inventory, abilities

### Backend
- `server/gmOrchestrator.ts` — GPT-4o GM with streaming, context building, state updates, auto-summarization
- `server/gameEngine.ts` — Dice mechanics (d20 system, advantage/disadvantage), character generation
- `server/routes.ts` — All API routes + WebSocket server
- `server/storage.ts` — Database CRUD interface
- `shared/schema.ts` — Drizzle ORM schema (event-sourced architecture)

## Game Data Model

### Characters
4 classes: Fighter (d12 HP), Rogue (d8), Wizard (d6), Cleric (d10)
8 races, 12 backgrounds
Stats: Might, Agility, Endurance, Intellect, Will, Presence
Event-sourced: HP, XP, inventory, conditions, abilities all updatable by GM

### Campaigns → Parties
- Campaign: settings, GM mode (fast/balanced/cinematic), content filters
- Party: invite code for multiplayer, ready states, world state snapshots
- Chat messages: player/gm roles, metadata for character names
- Scene summaries: auto-generated every 10 turns via gpt-4o-mini
- Arcs: trackable story goals

## GM Orchestrator
- Streams GPT-4o responses as SSE to frontend
- Builds rich system prompt with character sheets, world state, recent summaries
- Parses JSON response: `{narrative, dice_requests, proposed_updates, quick_actions, scene}`
- Applies state changes: HP, XP, items, conditions
- Auto-summarizes every 10 turns for memory management

## API Routes

```
GET  /api/characters           — Get user's characters
POST /api/characters           — Create character
GET  /api/characters/:id       — Get character sheet

POST /api/campaigns            — Create campaign + auto-party
GET  /api/campaigns/:id        — Get campaign + parties

GET  /api/parties              — Get user's parties
GET  /api/parties/:id          — Get party + members + campaign
POST /api/parties/join         — Join by invite code
POST /api/parties/:id/join     — Join by party ID
POST /api/parties/:id/ready    — Toggle ready state
GET  /api/parties/:id/messages — Get chat history
POST /api/parties/:id/action   — Player action → streaming GM response

POST /api/dice/roll            — Standalone dice roller
WS   /ws                       — Party WebSocket room
```

## Design
- Dark fantasy aesthetic: near-black background, golden/amber primary, Cinzel font for headings, Crimson Text for body
- Tailwind CSS with shadcn/ui components
- Defined in `client/src/index.css` with CSS custom properties

## Auth
- Replit Auth via `server/replit_integrations/auth`
- Session stored in PostgreSQL

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection
- `SESSION_SECRET` — Express session secret
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (via Replit AI integration)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL

## Development
```bash
npm run dev      # Start server + Vite frontend on port 5000
npm run db:push  # Push schema changes to database
```
