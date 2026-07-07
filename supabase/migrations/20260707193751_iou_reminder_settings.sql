-- Phase 1: Database Setup
-- Add minimum balance and minimum repayment percentage to iou_settings
ALTER TABLE public.iou_settings
ADD COLUMN IF NOT EXISTS minimum_balance_to_remind_minor INTEGER DEFAULT 50000,
ADD COLUMN IF NOT EXISTS minimum_repayment_percentage INTEGER DEFAULT 100 CHECK (minimum_repayment_percentage >= 1 AND minimum_repayment_percentage <= 100);
