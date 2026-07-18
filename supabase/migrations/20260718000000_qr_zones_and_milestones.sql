CREATE TABLE qr_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE qr_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON qr_zones
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for org members" ON qr_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM locations
            WHERE locations.id = qr_zones.location_id
            AND EXISTS (
                SELECT 1 FROM organization_members
                WHERE organization_members.organization_id = locations.organization_id
                AND organization_members.user_id = auth.uid()
            )
        )
    );

-- Add zone_id to qr_codes
ALTER TABLE qr_codes ADD COLUMN zone_id UUID REFERENCES qr_zones(id) ON DELETE SET NULL;

-- Add custom order milestones to locations
ALTER TABLE locations ADD COLUMN custom_order_milestones JSONB;
