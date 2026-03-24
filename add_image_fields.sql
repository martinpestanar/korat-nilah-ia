-- Migration: Add image generation fields to campanas table

-- Add fields to store the generated image URL and the prompt used
ALTER TABLE public.campanas 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_prompt TEXT,
ADD COLUMN IF NOT EXISTS design_preferences JSONB DEFAULT '{}'::jsonb;

-- Create a storage bucket for campaign assets if it doesn't exist (Requires manual Supabase Dashboard setup usually, but we can document it)
-- Note: Supabase storage buckets must be created via the Storage API or Dashboard. 
-- We will store the public URLs in the `image_url` column.

-- Add a comment to the table to document the new fields
COMMENT ON COLUMN public.campanas.image_url IS 'Public URL of the AI-generated image for this campaign';
COMMENT ON COLUMN public.campanas.image_prompt IS 'The final prompt sent to the AI model to generate the image';
COMMENT ON COLUMN public.campanas.design_preferences IS 'JSON object storing user preferences like format (1:1, 9:16), style, and variations';
