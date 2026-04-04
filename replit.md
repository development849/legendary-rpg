# Legendary℠ — AI-Powered Fantasy RPG

## Overview
Legendary℠ is an online fantasy RPG where an AI Game Master (powered by GPT-4o/Gemini) runs real-time campaigns. Players create persistent characters with AI-generated portraits, join parties via invite codes, and interact through natural language. The GM handles dice rolls, state updates, and narrative arcs using a custom d20 ruleset. The project aims to deliver an immersive, dynamic, and personalized tabletop RPG experience facilitated by advanced AI, envisioning a future where every player has access to an infinitely adaptable storytelling engine.

## User Preferences
I prefer simple language. I like functional programming. I want iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture
The application is built with a TypeScript, React, Express, PostgreSQL stack, utilizing WebSockets for real-time communication.

**Frontend:**
- **UI/UX:** Dark fantasy aesthetic with a near-black background, golden/amber accents, Cinzel font for headings, and Crimson Text for body. Built using Tailwind CSS and shadcn/ui components for a consistent design system.
- **Pages:** Includes dedicated pages for landing, authentication, dashboard, character creation (with AI portrait generation), campaign creation, party lobby, the main game session, and character sheets.
- **Interaction:** Features include a streaming GM chat, quick actions, a hierarchical journey map (Region > Major Location > Minor Location list with expandable AI scene thumbnails), a notice board system for quests, and a codex for learned recipes/spells.
- **Character Customization:** Extensive character creation with 8 classes, 12 races, point-envelope stat allocation, AI-generated backstories, and a Portrait Studio for DALL-E 3 generation.

**Backend:**
- **Core Logic:** `gmOrchestrator.ts` manages GPT-4o interactions, streaming responses, context building, state updates, and auto-summarization. `gameEngine.ts` handles dice mechanics and character generation.
- **API:** Express-based REST API for managing characters, campaigns, parties, and friends, alongside a WebSocket server for real-time party synchronization and game events.
- **Database:** PostgreSQL with Drizzle ORM, using an event-sourced architecture for critical game data like HP, MP, XP, inventory, and conditions.
- **Game Mechanics:** Implements a d20 system with advantage/disadvantage, comprehensive character data model (stats, abilities, inventory, achievements), MP system for casters, and a detailed level-up system with skill trees (class-specific and racial).
- **AI Integration:** GPT-4o is used for GM narrative generation, state updates, NPC interaction, backstory generation, and scene summarization. Gemini generates AI portraits and world map images.
- **Features:** Includes a friends system with request management, NPC companions with full character sheets and AI-driven leveling, and comprehensive equipment slot management.

## External Dependencies
- **OpenAI GPT-4o:** Primary AI Game Master for narrative, state management, and character backstories.
- **Google Gemini:** Used for AI-generated character portraits and world map images.
- **PostgreSQL:** Relational database for all persistent game data.
- **Drizzle ORM:** TypeScript ORM for database interaction.
- **React:** Frontend library.
- **Express:** Backend web framework.
- **WebSockets:** For real-time communication and party synchronization.
- **Radix UI / shadcn/ui:** UI component library and styling.
- **TanStack Query:** Data fetching and caching for the frontend.
- **Passport.js:** Authentication middleware.
- **bcrypt:** For password hashing.

## GM Streaming Architecture
- **Narrative filtering:** The GM orchestrator (`gmOrchestrator.ts`) streams only the narrative text to the client. Raw JSON blocks containing `proposed_updates` (XP_GRANTED, GOLD_CHANGED, SITUATION_UPDATED, etc.), `dice_requests`, and `quick_actions` are intercepted server-side and never shown in the chat dialogue.
- **Detection:** The streaming filter looks for ```` ```json ```` fences or `{"narrative":` patterns to detect JSON blocks. Only narrative prose is streamed via SSE chunks. Updates are sent via the `done` SSE event and WebSocket broadcasts.
- **Saved messages:** Chat messages in the database store only the clean narrative, not the raw GPT response with JSON blocks. Updates are preserved in the message `metadata` field.

## Session Persistence (Safari Fix)
- **Approach:** Login returns a `signedSessionId` in the JSON body, stored in `localStorage` under key `legendaryrpg_sid`.
- **Global fetch interceptor:** `client/src/main.tsx` patches `window.fetch` to automatically add `X-Session-Id` header to all `/api/` requests.
- **Server middleware:** `replitAuth.ts` header injection middleware reads `X-Session-Id` and injects it as a cookie before express-session processes it.
- **Auth verification:** After login/register, the frontend verifies the session works by calling GET `/api/auth/user` before navigating to the dashboard.

## Admin Panel
- **Route:** `/admin` (frontend) with `/api/admin/*` backend routes
- **Files:** `server/adminRoutes.ts` (backend), `client/src/pages/admin.tsx` (frontend)
- **Access Control:** Requires Replit OAuth login (local auth accounts are blocked). Admin email(s) configured via `ADMIN_EMAILS` env var (comma-separated).
- **Features:** Dashboard with user/character/campaign/party stats, paginated database table browser with sensitive column redaction, read-only SQL query console (SELECT only, 10s timeout, keyword blacklist).
- **Security:** `requireAdmin` middleware checks auth provider + email allowlist. Password hashes are redacted in all views. SQL queries restricted to SELECT with statement timeout and multi-statement blocking.