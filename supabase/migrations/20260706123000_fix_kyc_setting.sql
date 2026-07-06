update public.system_settings 
set value = '{"require_kyc_to_publish": false}'::jsonb 
where key = 'require_kyc_to_publish';
