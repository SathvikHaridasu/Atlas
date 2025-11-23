-- Add image_url column to messages table
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update RLS policies if needed (they should already allow INSERT with image_url)
-- The existing policies should work since they check membership, not specific columns

