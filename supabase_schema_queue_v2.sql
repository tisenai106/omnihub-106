-- Service Types (e.g., General, Priority, Returns)
create table if not exists service_types (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Attendants / Desks (e.g., "Guichê 01", "Maria - Caixa 2")
create table if not exists attendants (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- Display Name (e.g. "Guichê 01")
  desk_number text,   -- Optional extra identifier
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update Tickets to link to Attendants and Service Types
alter table tickets 
  add column if not exists attendant_id uuid references attendants(id) on delete set null,
  add column if not exists service_type_id uuid references service_types(id) on delete set null;

-- Realtime
alter publication supabase_realtime add table service_types;
alter publication supabase_realtime add table attendants;
