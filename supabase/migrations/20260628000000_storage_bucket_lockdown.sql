-- Phase 5: Storage Bucket Lockdown (DoW Protection)
-- Apply native file size constraints and MIME type whitelisting to the menu-images bucket
-- This prevents malicious authenticated users from uploading executable payloads or massive 10GB+ files via the SDK.

UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'menu-images';
