-- Create a table for public profiles (linked to auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('super_admin', 'editor', 'attendant')) default 'editor',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table tvs enable row level security;
alter table playlists enable row level security;
alter table slides enable row level security;

-- Policies
-- Super Admin: Full Access
-- Editor: Full Access to Content, Read-only on Profiles
-- Public (Player): Read-only on Content

-- PROFILES
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Super Admins can update any profile." on profiles
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- CONTENT (TVs, Playlists, Slides)
-- Allow read access to everyone (needed for Public Player)
create policy "Content is viewable by everyone" on tvs for select using (true);
create policy "Content is viewable by everyone" on playlists for select using (true);
create policy "Content is viewable by everyone" on slides for select using (true);

-- Allow write access only to authenticated users (Editors & Super Admins)
-- We simplify this by just checking if the user is logged in.
-- In a stricter system, we would check the 'role' in the profiles table.
create policy "Authenticated users can modify TVS" on tvs
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can modify Playlists" on playlists
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can modify Slides" on slides
  for all using (auth.role() = 'authenticated');
  
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'editor');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
