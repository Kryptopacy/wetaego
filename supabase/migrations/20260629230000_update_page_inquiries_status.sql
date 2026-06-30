-- Migration to update the page_inquiries status constraint to support a full CRM pipeline
-- Allowed statuses: 'new', 'contacted', 'viewing', 'offer', 'won', 'lost', 'closed'

ALTER TABLE public.page_inquiries
  DROP CONSTRAINT IF EXISTS page_inquiries_status_check;

ALTER TABLE public.page_inquiries
  ADD CONSTRAINT page_inquiries_status_check
  CHECK (status IN ('new', 'contacted', 'viewing', 'offer', 'won', 'lost', 'closed'));
