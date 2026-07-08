ALTER TABLE "public"."orders" ADD COLUMN "tracking_code" text;
CREATE INDEX idx_orders_tracking_code ON "public"."orders"("tracking_code");

CREATE TABLE "public"."order_milestones" (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "order_id" uuid NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "is_completed" boolean NOT NULL DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "order_milestones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_milestones_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE
);

CREATE INDEX idx_order_milestones_order_id ON "public"."order_milestones"("order_id");

ALTER TABLE "public"."order_milestones" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for order_milestones"
ON "public"."order_milestones"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert access for order_milestones"
ON "public"."order_milestones"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for order_milestones"
ON "public"."order_milestones"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
