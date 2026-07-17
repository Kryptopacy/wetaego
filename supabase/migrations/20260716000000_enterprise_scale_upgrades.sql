-- ============================================================
-- OurMenu: Enterprise Scale Upgrades
-- 1. Universal Taxonomy Engine (page_collections)
-- 2. Universal Search Engine (FTS on page_items)
-- 3. Polymorphic Orders Engine (page_item_id on order_items)
-- ============================================================

-- ============================================================
-- 1. Universal Taxonomy Engine
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.location_pages(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.page_collections(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_id, slug)
);

DROP TRIGGER IF EXISTS set_page_collections_updated_at ON public.page_collections;
DROP TRIGGER IF EXISTS set_page_collections_updated_at ON public.page_collections;
CREATE TRIGGER set_page_collections_updated_at
  BEFORE UPDATE ON public.page_collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.page_item_collections (
  item_id uuid NOT NULL REFERENCES public.page_items(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.page_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, collection_id)
);

-- RLS for collections
ALTER TABLE public.page_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_item_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view collections for published pages" ON public.page_collections;
CREATE POLICY "Anyone can view collections for published pages"
  ON public.page_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      WHERE lp.id = page_collections.page_id AND lp.is_published = true
    )
  );

DROP POLICY IF EXISTS "Anyone can view item collections for published pages" ON public.page_item_collections;
CREATE POLICY "Anyone can view item collections for published pages"
  ON public.page_item_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.page_items pi
      JOIN public.location_pages lp ON lp.id = pi.page_id
      WHERE pi.id = page_item_collections.item_id AND pi.is_published = true AND lp.is_published = true
    )
  );

DROP POLICY IF EXISTS "Editors can manage collections" ON public.page_collections;
CREATE POLICY "Editors can manage collections"
  ON public.page_collections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      WHERE lp.id = page_collections.page_id 
      AND private.has_org_role(l.organization_id, array['owner','manager','editor']::public.member_role[])
    )
  );

DROP POLICY IF EXISTS "Editors can manage item collections" ON public.page_item_collections;
CREATE POLICY "Editors can manage item collections"
  ON public.page_item_collections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.page_items pi
      JOIN public.location_pages lp ON lp.id = pi.page_id
      JOIN public.locations l ON l.id = lp.location_id
      WHERE pi.id = page_item_collections.item_id 
      AND private.has_org_role(l.organization_id, array['owner','manager','editor']::public.member_role[])
    )
  );

-- ============================================================
-- 2. Universal Search Engine (FTS)
-- ============================================================
ALTER TABLE public.page_items
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION public.update_page_item_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep it updated
DROP TRIGGER IF EXISTS trigger_page_item_search_vector ON public.page_items;
DROP TRIGGER IF EXISTS trigger_page_item_search_vector ON public.page_items;
CREATE TRIGGER trigger_page_item_search_vector
  BEFORE INSERT OR UPDATE OF title, subtitle, description
  ON public.page_items
  FOR EACH ROW EXECUTE FUNCTION public.update_page_item_search_vector();

-- Backfill existing rows
UPDATE public.page_items SET title = title WHERE search_vector IS NULL;

-- Add GIN Index
CREATE INDEX IF NOT EXISTS idx_page_items_search_vector ON public.page_items USING GIN (search_vector);

-- ============================================================
-- 3. Polymorphic Orders Engine
-- ============================================================
-- Add page_item_id to order_items to support multi-item checkout for non-restaurant catalogs
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS page_item_id uuid REFERENCES public.page_items(id) ON DELETE SET NULL;
