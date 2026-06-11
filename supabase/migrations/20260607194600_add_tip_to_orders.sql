ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount_minor integer DEFAULT 0;
