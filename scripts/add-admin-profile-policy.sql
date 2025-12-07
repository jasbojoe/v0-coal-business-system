-- Add RLS policy to allow service role to insert profiles for staff creation
-- The service role key should bypass RLS, but if it's not working, this policy will help

-- First, let's check if we need to add a policy for admin users
-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS profiles_insert_own ON profiles;

-- Create a more permissive insert policy that allows:
-- 1. Users to insert their own profile (id = auth.uid())
-- 2. Admin users to insert profiles for other users
CREATE POLICY profiles_insert_policy ON profiles
FOR INSERT
WITH CHECK (
  id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Also add a policy for service role to bypass (this is normally automatic but let's be explicit)
-- Note: Service role should automatically bypass RLS, but we'll add this for clarity
CREATE POLICY profiles_service_role_insert ON profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Update the staff table policies similarly to allow admin users
DROP POLICY IF EXISTS staff_insert_authenticated ON staff;

CREATE POLICY staff_insert_policy ON staff
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add service role policy for staff
CREATE POLICY staff_service_role_insert ON staff
FOR INSERT
TO service_role
WITH CHECK (true);
