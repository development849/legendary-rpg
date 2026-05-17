# Legendary RPG — Consolidated Replit Apply Guide

**Date:** 2026-05-08  
**For Stan:** This file consolidates all 8 pending Replit changes into a single numbered sequence. Paste each step's prompt block into Replit AI. Wait for confirmation after each step before moving to the next.

**Total estimated time:** 30–45 minutes for all 8 steps.

---

## What you're applying

| Step | Fix | Issue ID | Priority |
|---|---|---|---|
| 1 | Character creation sticky CTA + disabled Next + portrait hint | UXF-003/004/010 | P2 |
| 2 | Random name generator on Name field | FR-007 | P2 |
| 3 | World-consistency guardrail tone (no fourth-wall breaks) | UXF-011 | P3 |
| 4 | HP=0 downed state — game no longer ignores 0HP | LR-014 | **P1** |
| 5 | Level-up XP gate — no more free stat exploiting | LR-015 | **P1** |
| 6 | Leave Session button in game UI | UXF-008 | P2 |
| 7 | Verify character state persistence across sessions | FR-001 | P1 |
| 8 | GM narrative context persists across sessions | LR-017 | **P1** |

---

## Step 1 — Character Creation UX Batch (UXF-003, UXF-004, UXF-010)

> **Paste this into Replit AI:**

---

I need three UX improvements to the character creation flow. Please apply all three changes.

### Change 1 — Sticky CTA Bar (UXF-003)

In the character creation multi-step form (likely `client/src/pages/create-character.tsx` or the component handling the wizard steps), I want to add a sticky bottom bar that keeps the "Next" button visible at all times regardless of scroll position.

Add this component or inline styles to each step:

```tsx
// Sticky CTA Bar — add at the bottom of each step's JSX, or as a shared wrapper
<div
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '72px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#1a1b26',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    zIndex: 50,
    backdropFilter: 'blur(8px)',
  }}
>
  <span style={{
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.8125rem',
    color: '#8a7a5a',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  }}>
    Step {currentStep} of {totalSteps} · {stepLabel}
  </span>

  <div title={!canProceed ? tooltipText : undefined} style={{ cursor: !canProceed ? 'not-allowed' : 'default' }}>
    <button
      onClick={handleNext}
      disabled={!canProceed}
      style={canProceed ? {
        background: '#c8921a',
        color: '#0d0d12',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9375rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        borderRadius: '8px',
        padding: '12px 24px',
        border: 'none',
        cursor: 'pointer',
        transition: '120ms ease',
      } : {
        background: '#22233a',
        color: '#4a4535',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9375rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        borderRadius: '8px',
        padding: '12px 24px',
        border: 'none',
        cursor: 'not-allowed',
        opacity: 0.5,
        pointerEvents: 'none',
      }}
    >
      Next →
    </button>
  </div>
</div>
```

Also add `paddingBottom: '88px'` to the main page content container so content doesn't hide behind the sticky bar.

### Change 2 — Context-Sensitive Tooltip (UXF-004)

The `tooltipText` variable in the sticky bar above should be set per step:

```tsx
const tooltipText = (() => {
  switch (currentStep) {
    case CLASS_STEP: return 'Choose a class to continue';
    case RACE_STEP: return 'Choose a race to continue';
    case PORTRAIT_STEP: return 'Generate your portrait to continue';
    default: return 'Complete this step to continue';
  }
})();
```

The `canProceed` condition for each step:
- Class step: `!!selectedClass`
- Race step: `!!selectedRace`
- Portrait step: `!!character.profilePicture` (portrait URL is non-empty)
- Name/backstory steps: `name.trim().length > 0`

### Change 3 — Portrait Button Inline Feedback (UXF-010)

On the portrait step, beneath the "Generate Portrait" button, add this explanatory microcopy that shows when the button is disabled:

```tsx
{!allRequiredFieldsFilled && (
  <p style={{
    marginTop: '8px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.8125rem',
    color: '#8a7a5a',
    textAlign: 'center',
  }}>
    Complete your character details above to generate your portrait.
  </p>
)}
```

`allRequiredFieldsFilled` should be true when name, class, race, and background are all non-empty.

After applying all three changes: confirm the app loads (HTTP 200) and list which files were changed.

---

> ✓ **Step 1 success check:** App loads (HTTP 200). Open character creation in browser — sticky CTA bar is visible at the bottom. On the class step, the Next button is disabled until a class is selected.

---

## Step 2 — Random Name Generator (FR-007)

> **Paste this into Replit AI:**

---

Add a random name generator to the character creation Name field. When the player clicks a dice icon next to the name input, a randomly chosen heroic name is inserted into the field (still editable).

### Step 1 — Add the name pool constant

At the top of `client/src/pages/create-character.tsx` (or wherever the Name input lives), add:

```tsx
const HEROIC_NAME_POOL = [
  "Kael", "Vora", "Thane", "Seris", "Maren", "Dravan", "Lyss", "Torren",
  "Zael", "Eira", "Cass", "Aldric", "Nyx", "Rowan", "Sable", "Oryn",
  "Dael", "Mirra", "Vex", "Hael",
  "Riven", "Soran", "Kira", "Zenn", "Lux", "Strix", "Vesper", "Onyx",
  "Cipher", "Nova",
  "Bramble", "Isolde", "Fenris", "Cael", "Wren", "Signe", "Ash", "Orin",
  "Bryn", "Thal",
] as const;

const getRandomName = (): string => {
  return HEROIC_NAME_POOL[Math.floor(Math.random() * HEROIC_NAME_POOL.length)];
};
```

### Step 2 — Add the dice button next to the Name input

Find the Name `<input>` field in character creation and wrap it with a relative-positioned container, then add a dice icon button:

```tsx
<div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Your character's name"
    style={{ paddingRight: '44px', /* existing styles */ }}
  />
  <button
    type="button"
    onClick={() => setName(getRandomName())}
    title="Random name"
    style={{
      position: 'absolute',
      right: '8px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#8a7a5a',
      fontSize: '18px',
      padding: '4px',
      lineHeight: 1,
      transition: '120ms ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = '#c8921a')}
    onMouseLeave={(e) => (e.currentTarget.style.color = '#8a7a5a')}
  >
    🎲
  </button>
</div>
```

If the project uses lucide-react, you can replace `🎲` with `<Shuffle size={16} />` imported from `lucide-react`.

After applying: confirm app loads (HTTP 200) and list the file(s) changed.

---

> ✓ **Step 2 success check:** App loads (HTTP 200). On the Name step of character creation, a 🎲 button appears next to the name input. Clicking it inserts a name into the field.

---

## Step 3 — World-Consistency Guardrail Tone Fix (UXF-011)

> **Paste this into Replit AI:**

---

In `server/gmOrchestrator.ts`, find the section in `buildSystemPrompt` that handles the world-consistency guardrail — the instruction that redirects physically impossible player actions. It was added as UXF-007 in Sprint 03.

Find the instruction text about redirecting "impossible or anachronistic actions" and replace it with this improved version:

```
When a player attempts an action that is physically impossible or violates this world's genre and technology level, acknowledge their impulse with conviction and redirect it to a plausible in-world alternative. Do NOT use meta-commentary or fourth-wall breaks. Do NOT say "that's ambitious" or "alas" or hedge with phrases like "in the realm of possibility." Stay fully inside the world voice. Example of correct handling: "Your body refuses the impossible transformation — [character name] has no such power in this world. But your instincts drive you forward..." The redirect must feel like a natural narrative beat, not a rules correction from a referee.
```

This is a one-line instruction change in the system prompt string. The surrounding code should not change.

After applying: confirm app loads (HTTP 200) and report the exact file and approximate line number changed.

---

> ✓ **Step 3 success check:** App loads (HTTP 200). File changed is `server/gmOrchestrator.ts`.

---

## Step 4 — HP=0 Downed State (LR-014) ⚠️ P1

> **Paste this into Replit AI:**

---

There is a P1 bug: when a player's HP reaches 0, the game continues normally. The GM narrates normally, no downed condition is applied, and the player keeps taking actions. I need the server to detect 0HP and handle it correctly.

### Fix 1 — Server-side HP guard in `server/gmOrchestrator.ts`

In `buildSystemPrompt` (or wherever character state is injected into the GM system prompt), add an HP guard that injects a special directive when the character is at 0 HP:

```typescript
const isCharacterDowned = currentHp !== undefined && currentHp <= 0;

if (isCharacterDowned) {
  systemPromptParts.unshift(`
CRITICAL PRIORITY — CHARACTER DOWNED:
${characterName} has reached 0 HP and is incapacitated. You MUST:
1. Narrate their collapse, incapacitation, or near-death — no normal action is possible.
2. Immediately emit a CONDITION_CHANGED state update: {"type": "CONDITION_CHANGED", "condition": "Downed", "active": true}
3. Block any player action that implies normal physical capability (moving, fighting, speaking at full volume). Redirect with: "${characterName} is barely conscious — they cannot do that in their current state."
4. Allow: calling for help, crawling, using a healing item if one exists in inventory, making death saves (optional flavour).
5. The only valid exits from Downed state: receiving healing that restores HP above 0 (emit HP_CHANGED to positive value and CONDITION_CHANGED to remove "Downed"), or narrative defeat (end scene).
This directive overrides all other narrative instructions while HP is 0.
  `.trim());
}
```

### Fix 2 — Force-add Downed condition if missing

After processing state updates from each GM response, add a guard:

```typescript
if (sessionState.currentHp <= 0 && !sessionState.conditions.includes('Downed')) {
  sessionState.conditions = [...sessionState.conditions, 'Downed'];
  stateUpdates.push({ type: 'CONDITION_CHANGED', condition: 'Downed', active: true });
}
```

### Fix 3 — Client-side: show downed state indicator

In the character sheet or HP display (likely in `client/src/pages/game-session.tsx`), add a visual indicator when the character has the "Downed" condition:

```tsx
{character.conditions?.includes('Downed') && (
  <div style={{
    padding: '6px 12px',
    background: '#c03030',
    color: '#fff',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    borderRadius: '4px',
    marginTop: '8px',
  }}>
    ⚠ DOWNED — 0 HP
  </div>
)}
```

After applying: confirm app loads (HTTP 200) and list all files changed.

---

> ✓ **Step 4 success check:** App loads (HTTP 200). Files changed include `server/gmOrchestrator.ts` and `client/src/pages/game-session.tsx`.

---

## Step 5 — Level-Up XP Gate (LR-015) ⚠️ P1

> **Paste this into Replit AI:**

---

There is a P1 exploit: the level-up API endpoint accepts stat allocations without checking if the character has enough XP. A player can call it repeatedly to farm stats indefinitely.

### Find the level-up endpoint

Find the `PATCH /api/characters/:id/level-up` handler (likely in `server/routes.ts`, `server/api.ts`, or similar).

### Add the XP gate

At the **start** of the level-up handler, before any stat allocation is applied:

```typescript
// LR-015 fix: XP threshold gate
const character = await db.query.characters.findFirst({
  where: eq(characters.id, characterId),
});

if (!character) {
  return res.status(404).json({ error: 'Character not found' });
}

const XP_THRESHOLDS: Record<number, number> = {
  1: 300,    // XP to reach Level 2
  2: 700,    // XP to reach Level 3
  3: 1200,   // XP to reach Level 4
  4: 1800,   // XP to reach Level 5
  5: 2500,   // Level 6+
};

const currentLevel = character.level ?? 1;
const xpRequired = XP_THRESHOLDS[currentLevel] ?? (currentLevel * currentLevel * 100 + 200);

if (character.xp < xpRequired) {
  return res.status(400).json({
    error: 'Not enough XP to level up',
    currentXp: character.xp,
    xpRequired,
    xpRemaining: xpRequired - character.xp,
  });
}
```

If the codebase already has an XP threshold definition, use that instead.

### Also verify XP increment logic

Check: does the XP field increment correctly when the GM awards XP via `XP_GAINED` state updates? Search for `XP_GAINED` in `server/gmOrchestrator.ts`. If it's not wired up, add:

```typescript
case 'XP_GAINED':
  if (update.amount && typeof update.amount === 'number') {
    await db.update(characters)
      .set({ xp: sql`${characters.xp} + ${update.amount}` })
      .where(eq(characters.id, characterId));
  }
  break;
```

After applying: confirm app loads (HTTP 200). Test: call `PATCH /api/characters/{id}/level-up` on a Level 1 character with low XP (e.g. 100 XP) and confirm you receive `{"error": "Not enough XP to level up"}`. List all files changed.

---

> ✓ **Step 5 success check:** App loads (HTTP 200). Level-up call on a low-XP character returns 400 with `"Not enough XP to level up"`.

---

## Step 6 — Leave Session Button (UXF-008)

> **Paste this into Replit AI:**

---

Players have no visible way to exit a game session. They must close the browser or know to type "I quit" to the GM. I need a persistent "Leave Session" button in the game UI.

### Find the game session top bar

In `client/src/pages/game-session.tsx` (or the game session layout), find the top navigation bar where the session title and character name are displayed.

### Add the Leave Session button

Add a `← Leave Session` button to the left side of the top bar:

```tsx
import { useLocation } from 'wouter'; // or React Router equivalent
const [, navigate] = useLocation(); // or useNavigate() if using React Router

// In the JSX top bar:
<button
  onClick={() => navigate('/dashboard')}
  title="Return to dashboard"
  style={{
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#8a7a5a',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.8125rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: '120ms ease',
    flexShrink: 0,
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8921a';
    (e.currentTarget as HTMLButtonElement).style.color = '#c8921a';
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
    (e.currentTarget as HTMLButtonElement).style.color = '#8a7a5a';
  }}
>
  ← Leave Session
</button>
```

If the project uses React Router v6 instead of wouter:
```tsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
// onClick={() => navigate('/dashboard')}
```

The button should:
- Always be visible during an active game session
- NOT be shown in character creation or campaign creation flows
- Navigate to `/dashboard` immediately on click (no confirmation — session data is saved)

After applying: confirm app loads (HTTP 200) and that the button is visible in the game session view. List files changed.

---

> ✓ **Step 6 success check:** App loads (HTTP 200). In a game session, "← Leave Session" button is visible in the top bar. Clicking it navigates to the dashboard.

---

## Step 7 — Character State Persistence Verification (FR-001)

> **Paste this into Replit AI:**

---

I need to verify and fix character state persistence for the Legendary RPG project.

**Problem:** When a player ends a game session and returns later, we need to confirm that HP, XP, inventory, conditions, and story progress all survive the session end. Character mechanical state is likely persisting to the database already (we have HP_CHANGED, XP_CHANGED, ITEM_GRANTED etc. writing to DB), but I need you to confirm this and fix any gaps.

**What to check:**
1. In `server/routes.ts` or wherever the game session endpoint lives — when a session ends or the client disconnects, is the character's current state (currentHp, xp, inventory, conditions) written to the DB? If not, add an endpoint or hook to save on session end.
2. When a player resumes a campaign (`GET /api/parties/:id` or equivalent session load), is the saved character state loaded correctly and passed to the game session?
3. Confirm the campaign record links back to the correct character state.

**Fix if needed:** Add a `POST /api/sessions/:id/save` endpoint (or modify session close logic) to persist the current character state snapshot. Add a corresponding load on session resume.

Report: which files you changed, what was already working, and what needed fixing. Confirm app is healthy (HTTP 200) after changes.

---

> ✓ **Step 7 success check:** App loads (HTTP 200). Report from Replit AI confirms character HP/XP/inventory/conditions persist between sessions (either already working or fixed).

---

## Step 8 — GM Narrative Context Persistence (LR-017) ⚠️ P1

> **Paste this into Replit AI:**

---

I need to add GM narrative context persistence to the Legendary RPG project.

**Problem (LR-017):** The GM builds its system prompt fresh each session via `buildSystemPrompt` in `server/gmOrchestrator.ts`. This does not include any memory of previous sessions — the GM knows the character sheet but not the story so far. A player who returns the next day gets a GM with complete narrative amnesia. Character stats intact; GM remembers nothing.

**What to add:**
1. In the campaign DB record (or a new `campaign_narratives` table), add a `narrativeSummary` field (text, nullable). This stores a rolling plain-text summary of the story so far, max ~400 words.
2. After each game session ends (or after every N turns — your call on implementation), generate a brief narrative summary and write it to `campaign.narrativeSummary`. You can use a cheap model call (gpt-4o-mini) to summarise the last session's Chronicle content, or just append the last 3 GM messages as plaintext.
3. In `buildSystemPrompt`, if `campaign.narrativeSummary` is non-null, inject it into the system prompt under a section called `## Story So Far`. Place it before the current scene instructions.
4. If there is no summary yet (first session), skip the injection silently.

**Definition of done:**
- A player ending and restarting a campaign sees the GM reference prior events
- `buildSystemPrompt` includes a "Story So Far" section when a summary exists
- App healthy (HTTP 200) after changes

Report files changed and confirm health check.

---

> ✓ **Step 8 success check:** App loads (HTTP 200). `server/gmOrchestrator.ts` and at least one DB schema file changed. Replit AI confirms narrative summary injection is wired up.

---

## All done — report back

Once all 8 steps are confirmed, please paste this filled-in summary into the Sprint 07 file (`sprints/SPRINT_07.md`) under the [DEV] Updates section:

```
Steps applied: 1 ☐  2 ☐  3 ☐  4 ☐  5 ☐  6 ☐  7 ☐  8 ☐
Files changed: [list]
HTTP 200 confirmed: yes / no
Any errors: [describe or "none"]
```

Then run `sprints/SPRINT_07_VERIFY.md` to confirm all fixes are live.
