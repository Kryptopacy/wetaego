-- Expand order_reviews for independent staff and business feedback

ALTER TABLE public.order_reviews 
  RENAME COLUMN rating TO staff_rating;

ALTER TABLE public.order_reviews 
  RENAME COLUMN feedback TO staff_feedback;

ALTER TABLE public.order_reviews 
  ADD COLUMN IF NOT EXISTS business_rating integer CHECK (business_rating >= 1 AND business_rating <= 5),
  ADD COLUMN IF NOT EXISTS business_feedback text;
