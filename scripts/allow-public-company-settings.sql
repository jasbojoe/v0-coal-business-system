-- Allow public (unauthenticated) users to read company settings
-- This is needed for the website contact section to display company info

-- Drop existing select policy if it only allows authenticated users
DROP POLICY IF EXISTS "company_settings_select_authenticated" ON public.company_settings;

-- Create new policy that allows anyone to read company settings
CREATE POLICY "company_settings_select_public" ON public.company_settings
  FOR SELECT
  USING (true);

-- Keep the insert/update policies for authenticated users only
-- (no changes needed - they should already exist)
