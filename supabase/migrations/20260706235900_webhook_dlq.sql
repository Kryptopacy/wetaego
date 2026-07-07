-- Migration: Add status and error_message to webhook_events for DLQ
-- This enables tracking of failed webhooks for manual replay or analysis

ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS status text DEFAULT 'success',
ADD COLUMN IF NOT EXISTS error_message text;

-- Backfill existing records
UPDATE webhook_events
SET status = 'success'
WHERE status IS NULL;
