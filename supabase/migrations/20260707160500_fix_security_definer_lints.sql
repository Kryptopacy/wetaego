-- Properly ignore the SECURITY DEFINER warnings for intentionally public/authenticated functions
COMMENT ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) IS '@supabase-lint-ignore anon_security_definer_function_executable
@supabase-lint-ignore authenticated_security_definer_function_executable
Intentionally accessible by anon and authenticated for audit logging';

COMMENT ON FUNCTION public.accept_invite_by_token(text) IS '@supabase-lint-ignore authenticated_security_definer_function_executable
Intentionally accessible by authenticated users to accept invites';

COMMENT ON FUNCTION public.claim_order(uuid, integer) IS '@supabase-lint-ignore authenticated_security_definer_function_executable
Intentionally accessible by authenticated staff to claim orders';
