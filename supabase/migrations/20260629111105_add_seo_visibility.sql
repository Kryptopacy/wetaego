-- Add is_search_visible column to locations table for SEO compliance
ALTER TABLE locations
ADD COLUMN is_search_visible BOOLEAN DEFAULT false;

COMMENT ON COLUMN locations.is_search_visible IS 'Whether the tenant explicitly opted in to having their location indexed by search engines and AI for SEO/AEO purposes.';
