-- Create Tickets Table
create table if not exists tickets (
  id uuid default uuid_generate_v4() primary key,
  number text not null, -- formatted as #001, etc.
  status text check (status in ('waiting', 'called', 'completed')) default 'waiting',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  called_at timestamp with time zone
);

-- Add Display Mode to TVs
alter table tvs add column if not exists display_mode text default 'playlist'; -- 'playlist' or 'queue'

-- Realtime for Tickets
alter publication supabase_realtime add table tickets;
