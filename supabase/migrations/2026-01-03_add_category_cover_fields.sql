-- Migration: Add category cover metadata fields
-- Date: 2026-01-03
-- Description: Adds cover media configuration columns for category cards

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS cover_type TEXT DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_video TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_mobile_image TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_overlay TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS cover_cta_text TEXT DEFAULT 'Keşfet',
  ADD COLUMN IF NOT EXISTS cover_subtitle TEXT DEFAULT '';

-- Optional backfill: align cover_image with existing image values
UPDATE categories
SET cover_image = COALESCE(NULLIF(cover_image, ''), image)
WHERE TRUE;
