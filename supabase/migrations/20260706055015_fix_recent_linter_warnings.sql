-- Fix function_search_path_mutable for process_iou_repayment
ALTER FUNCTION public.process_iou_repayment(uuid, uuid, uuid, int, text) SET search_path = public;

-- Suppress SECURITY DEFINER warnings for functions intentionally executed by anon/authenticated roles
COMMENT ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';

COMMENT ON FUNCTION public.accept_invite_by_token(text) IS '@supabase-lint-ignore authenticated_security_definer_function_executable';

COMMENT ON FUNCTION public.claim_order(uuid, integer) IS '@supabase-lint-ignore authenticated_security_definer_function_executable';
