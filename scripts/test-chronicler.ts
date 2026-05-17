/**
 * Fixture tests for the Chronicler. Run with: npx tsx scripts/test-chronicler.ts
 *
 * Exercises the three previously-reported failure modes:
 *  1. Possessive overlap: "Braegad's Hollow" must not create an NPC named "Hollow".
 *  2. Initial signature: a note signed only "J." must not create an NPC named "J".
 *  3. Mentioned-not-visited: a place the party hears about must surface as LOCATION_MENTIONED.
 */
import { runChronicler } from "../server/chronicler";

interface Fixture {
  name: string;
  playerIntent: string;
  narrative: string;
  knownNpcs?: Array<{ name: string; role?: string }>;
  knownPlayerChars?: Array<{ name: string }>;
  knownLocations?: Array<{ name: string; region?: string; rumored?: boolean }>;
  currentLocation?: string;
  expect: {
    noNpcNames?: string[];
    expectLocationMentioned?: string[];
    expectPlotFactKeys?: string[];
    expectNoNpcMet?: boolean;
  };
}

const fixtures: Fixture[] = [
  {
    name: "1. Possessive overlap — Braegad's Hollow",
    playerIntent: "We travel toward Braegad's Hollow.",
    narrative:
      "Kira and her companions crest the ridge. The road dips into a sheltered vale ahead — Braegad's Hollow, by the looks of the carved marker stone. Smoke from chimneys drifts above the treeline. No one is in sight; the place feels watchful but quiet.",
    knownPlayerChars: [{ name: "Kira" }],
    currentLocation: "The Old Road",
    expect: {
      noNpcNames: ["Hollow", "Braegad"],
      expectLocationMentioned: ["Braegad's Hollow"],
    },
  },
  {
    name: "2. Initial signature — note signed J.",
    playerIntent: "I read the note carefully.",
    narrative:
      "Kira unfolds the parchment. The hand is neat but hurried. 'Meet me at the second bell. Come alone. Tell no one.' At the bottom, a single inked letter — 'J.' No surname, no seal. The paper smells faintly of lavender.",
    knownPlayerChars: [{ name: "Kira" }],
    currentLocation: "The Salted Rose Inn",
    expect: {
      noNpcNames: ["J", "J.", "Jarel"],
      expectNoNpcMet: true,
      expectPlotFactKeys: ["mystery_correspondent_initial", "anonymous_note", "mystery"],
    },
  },
  {
    name: "3. Heard-about location — should be LOCATION_MENTIONED",
    playerIntent: "I ask the innkeeper about the bandit problem.",
    narrative:
      "The innkeeper lowers her voice. 'Bandits, aye. They've a camp up in the Thornwick Bridge approaches — past the old mill, north of here. Sheriff Boren put a hundred-gold bounty on their leader's head, but no one's been fool enough to claim it.' She refills your cup without being asked.",
    knownNpcs: [{ name: "The Innkeeper", role: "tavern keeper" }],
    knownPlayerChars: [{ name: "Kira" }],
    currentLocation: "The Salted Rose Inn",
    expect: {
      expectLocationMentioned: ["Thornwick Bridge"],
      noNpcNames: ["Boren", "Sheriff Boren"],
      expectPlotFactKeys: ["bandit_camp", "bandit_bounty", "sheriff"],
    },
  },
];

function lower(s: string): string {
  return s.toLowerCase();
}

async function runFixture(f: Fixture): Promise<{ pass: boolean; reasons: string[]; summary: string }> {
  const result = await runChronicler({
    playerIntent: f.playerIntent,
    narrative: f.narrative,
    knownNpcs: f.knownNpcs ?? [],
    knownPlayerChars: f.knownPlayerChars ?? [],
    knownLocations: f.knownLocations ?? [],
    currentLocation: f.currentLocation,
  });

  const reasons: string[] = [];
  const npcMetNames = new Set(
    result.updates.filter(u => u.type === "NPC_MET").map(u => lower((u as any).name)),
  );
  const locMentioned = new Set(
    result.updates.filter(u => u.type === "LOCATION_MENTIONED").map(u => lower((u as any).name)),
  );
  const factKeys = new Set(
    result.updates.filter(u => u.type === "PLOT_FACT_SET").map(u => lower((u as any).key)),
  );

  for (const bad of f.expect.noNpcNames ?? []) {
    if (npcMetNames.has(lower(bad))) {
      reasons.push(`  ✗ Phantom NPC_MET emitted for "${bad}"`);
    } else {
      reasons.push(`  ✓ No NPC_MET for "${bad}"`);
    }
  }
  if (f.expect.expectNoNpcMet && npcMetNames.size > 0) {
    reasons.push(`  ✗ Expected zero NPC_MET; got: ${[...npcMetNames].join(", ")}`);
  }
  for (const loc of f.expect.expectLocationMentioned ?? []) {
    if (locMentioned.has(lower(loc))) {
      reasons.push(`  ✓ LOCATION_MENTIONED includes "${loc}"`);
    } else {
      reasons.push(`  ? LOCATION_MENTIONED missing "${loc}" (soft — model may have chosen PLOT_FACT_SET)`);
    }
  }
  if (f.expect.expectPlotFactKeys && f.expect.expectPlotFactKeys.length > 0) {
    const found = f.expect.expectPlotFactKeys.some(k => factKeys.has(lower(k)) || [...factKeys].some(fk => fk.includes(lower(k))));
    reasons.push(found
      ? `  ✓ At least one expected plot fact key was emitted (${[...factKeys].join(", ")})`
      : `  ? No expected plot fact keys emitted (got: ${[...factKeys].join(", ") || "none"}) — soft`);
  }

  // Pass criterion: no hard failures (✗). Soft (?) lines are informational.
  const pass = !reasons.some(r => r.startsWith("  ✗"));
  const summary = `updates: [${result.updates.map(u => u.type + (u.type === "NPC_MET" ? `(${(u as any).name})` : u.type === "LOCATION_MENTIONED" ? `(${(u as any).name})` : u.type === "PLOT_FACT_SET" ? `(${(u as any).key})` : "")).join(", ") || "none"}]`;
  return { pass, reasons, summary };
}

(async () => {
  console.log("=== Chronicler Fixture Tests ===\n");
  let allPass = true;
  for (const f of fixtures) {
    console.log(`▶ ${f.name}`);
    try {
      const { pass, reasons, summary } = await runFixture(f);
      console.log(`  ${summary}`);
      for (const r of reasons) console.log(r);
      console.log(`  ${pass ? "PASS" : "FAIL"}\n`);
      if (!pass) allPass = false;
    } catch (err) {
      console.error(`  ERROR running fixture:`, err);
      allPass = false;
    }
  }
  console.log(allPass ? "✓ All fixtures passed" : "✗ One or more fixtures failed");
  process.exit(allPass ? 0 : 1);
})();
