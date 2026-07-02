sql = """-- Inventory Manager: Physical stock tracking

DO $$ BEGIN
  CREATE TYPE public.inventory_movement_type AS ENUM ('restock', 'use', 'wastage', 'sale', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text NOT NULL DEFAULT 'General',
  unit text NOT NULL DEFAULT 'pieces',
  current_quantity numeric(12,3) NOT NULL DEFAULT 0,
  reorder_threshold numeric(12,3),
  cost_price_minor integer,
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type public.inventory_movement_type NOT NULL,
  quantity numeric(12,3) NOT NULL,
  note text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_org_loc ON public.inventory_items(organization_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org ON public.inventory_movements(organization_id, created_at DESC);

CREATE OR REPLACE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_inventory_quantity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $func$
BEGIN
  UPDATE public.inventory_items
  SET current_quantity = current_quantity + NEW.quantity, updated_at = now()
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE TRIGGER after_inventory_movement_insert
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_quantity();

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_read_inv_items ON public.inventory_items FOR SELECT TO authenticated USING (private.is_org_member(organization_id));
CREATE POLICY editor_manage_inv_items ON public.inventory_items FOR ALL TO authenticated USING (private.has_org_role(organization_id, ARRAY['owner','manager','editor']::public.member_role[])) WITH CHECK (private.has_org_role(organization_id, ARRAY['owner','manager','editor']::public.member_role[]));
CREATE POLICY org_read_inv_movements ON public.inventory_movements FOR SELECT TO authenticated USING (private.is_org_member(organization_id));
CREATE POLICY editor_log_inv_movements ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (private.has_org_role(organization_id, ARRAY['owner','manager','editor']::public.member_role[]));
"""

with open('supabase/migrations/20260702170000_inventory_manager.sql', 'w', encoding='utf-8', newline='\n') as f:
    f.write(sql)

print('Done')
