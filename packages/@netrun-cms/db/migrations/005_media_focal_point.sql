-- Add focal point coordinates to media for responsive image cropping.
-- Addresses Strapi's LeonGatt complaint: "Strapi does not allow defining a persistent focus point"
-- Values are percentages (0-100) representing the point of interest.
-- Default (50, 50) = center of image.

ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS focal_x REAL DEFAULT 50.0;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS focal_y REAL DEFAULT 50.0;

-- Also add image dimensions as first-class columns (currently buried in metadata JSONB)
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS height INTEGER;

-- Backfill dimensions from metadata JSONB where available
UPDATE cms_media
SET width = (metadata->>'width')::integer,
    height = (metadata->>'height')::integer
WHERE metadata->>'width' IS NOT NULL
  AND width IS NULL;
