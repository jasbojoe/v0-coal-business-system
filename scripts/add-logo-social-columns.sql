-- Add logo_light_url and logo_dark_url columns to company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT;

-- Also add social media URL columns for the footer fix
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
