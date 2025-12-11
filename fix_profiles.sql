-- INSERT MISSING PROFILES
-- This script finds all users in auth.users that do NOT have a profile
-- and inserts them into public.profiles with the role 'super_admin'.

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Optional: Ensure RLS is enabled (just to be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
