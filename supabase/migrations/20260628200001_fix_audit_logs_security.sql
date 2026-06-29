-- Fix audit logs security
-- 1. Ensure log_audit_event checks organization membership
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
    v_has_access BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if user has access to this organization
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members WHERE user_id = v_user_id AND organization_id = p_organization_id
        UNION
        SELECT 1 FROM public.organizations WHERE id = p_organization_id AND created_by = v_user_id
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: User does not belong to the specified organization';
    END IF;
    
    INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (p_organization_id, v_user_id, p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Prevent direct INSERT to audit_logs entirely (force usage of RPC)
DROP POLICY IF EXISTS "Users can insert their own audit logs via RPC" ON public.audit_logs;
CREATE POLICY "Prevent direct inserts to audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (false);
