-- Task #8: introduce per-row genre on characters and campaigns.
-- The column defaults to 'fantasy' so existing rows backfill automatically
-- and the runtime behaviour stays identical to the fantasy-only era.

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "genre" text NOT NULL DEFAULT 'fantasy';

ALTER TABLE "campaigns"
  ADD COLUMN IF NOT EXISTS "genre" text NOT NULL DEFAULT 'fantasy';

-- Explicit backfill for any historical rows that somehow ended up NULL
-- (defensive — the DEFAULT above already covers fresh ALTERs).
UPDATE "characters" SET "genre" = 'fantasy' WHERE "genre" IS NULL;
UPDATE "campaigns"  SET "genre" = 'fantasy' WHERE "genre" IS NULL;
