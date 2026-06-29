-- Alter existing audit logs table instead of re-creating it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_id') THEN
        ALTER TABLE public.audit_logs RENAME COLUMN actor_id TO user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_table') THEN
        ALTER TABLE public.audit_logs RENAME COLUMN entity_table TO entity_type;
    END IF;
END $$;

ALTER TABLE public.audit_logs ALTER COLUMN entity_id TYPE TEXT USING entity_id::TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their organizations"
    ON public.audit_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR
        organization_id IN (
            SELECT id FROM public.organizations WHERE created_by = auth.uid()
        )
    );

-- Only service role can insert (Server actions / Edge functions)
CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true); -- Usually enforced by using service role key, but this allows anon/auth insert if called directly. Actually, we should restrict it better.

-- Better to use a secure RPC for inserting audit logs
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_organization_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (p_organization_id, v_user_id, p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- Revoke direct insert
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs via RPC"
    ON public.audit_logs FOR INSERT
    WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');
