-- City OS: source of truth for citizens, municipal occurrences, protocols and
-- municipal publications. This migration is intentionally self-contained: the
-- linked project did not have a migration history when it was introduced.

create extension if not exists pgcrypto;

create table if not exists public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  ibge_code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, state)
);

create table if not exists public.citizen_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  municipality_id uuid references public.municipalities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep the migration safe when a previous manual schema already exists.
alter table public.citizen_profiles
  add column if not exists avatar_path text,
  add column if not exists municipality_id uuid references public.municipalities(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.protocols (
  id uuid primary key default gen_random_uuid(),
  protocol_code text not null unique,
  citizen_id uuid not null references auth.users(id) on delete cascade,
  municipality_id uuid not null references public.municipalities(id),
  category text not null,
  subject text not null,
  description text,
  status text not null default 'received' check (status in ('received', 'in_analysis', 'forwarded', 'in_service', 'resolved', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.occurrences (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references auth.users(id) on delete cascade,
  municipality_id uuid not null references public.municipalities(id),
  protocol_id uuid references public.protocols(id) on delete set null,
  type_id text not null,
  description text not null,
  latitude numeric,
  longitude numeric,
  address text,
  neighborhood text,
  locality text,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  agency text,
  status text not null default 'received' check (status in ('received', 'in_analysis', 'forwarded', 'in_service', 'resolved', 'cancelled')),
  confirmations_count integer not null default 0 check (confirmations_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null))
);

alter table public.occurrences
  add column if not exists confirmations_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.occurrence_media (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.occurrence_confirmations (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  citizen_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (occurrence_id, citizen_id)
);

-- Municipal teams publish these rows through a trusted back-office, never from
-- the citizen client. The client only reads currently published content.
create table if not exists public.city_feed (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  kind text not null check (kind in ('announcement', 'notice', 'work', 'campaign', 'institutional', 'banner')),
  title text not null,
  description text,
  image_path text,
  link_url text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.city_events (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  image_path text,
  link_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create index if not exists occurrences_citizen_created_at_idx
  on public.occurrences (citizen_id, created_at desc);
create index if not exists occurrences_municipality_created_at_idx
  on public.occurrences (municipality_id, created_at desc);
create index if not exists protocols_citizen_created_at_idx
  on public.protocols (citizen_id, created_at desc);
create index if not exists occurrence_media_occurrence_id_idx
  on public.occurrence_media (occurrence_id);
create index if not exists city_feed_visibility_idx
  on public.city_feed (municipality_id, published_at desc);
create index if not exists city_events_visibility_idx
  on public.city_events (municipality_id, starts_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists municipalities_set_updated_at on public.municipalities;
create trigger municipalities_set_updated_at
before update on public.municipalities
for each row execute function public.set_updated_at();

drop trigger if exists citizen_profiles_set_updated_at on public.citizen_profiles;
create trigger citizen_profiles_set_updated_at
before update on public.citizen_profiles
for each row execute function public.set_updated_at();

drop trigger if exists protocols_set_updated_at on public.protocols;
create trigger protocols_set_updated_at
before update on public.protocols
for each row execute function public.set_updated_at();

drop trigger if exists occurrences_set_updated_at on public.occurrences;
create trigger occurrences_set_updated_at
before update on public.occurrences
for each row execute function public.set_updated_at();

drop trigger if exists city_feed_set_updated_at on public.city_feed;
create trigger city_feed_set_updated_at
before update on public.city_feed
for each row execute function public.set_updated_at();

drop trigger if exists city_events_set_updated_at on public.city_events;
create trigger city_events_set_updated_at
before update on public.city_events
for each row execute function public.set_updated_at();

-- The trigger makes a profile available as soon as Auth confirms a user. Its
-- initial display name is optional metadata only; authorization always uses
-- auth.uid(), never metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.citizen_profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill only existing authenticated users; this has no fabricated citizens.
insert into public.citizen_profiles (id, full_name)
select id, nullif(trim(raw_user_meta_data ->> 'full_name'), '')
from auth.users
on conflict (id) do nothing;

create sequence if not exists public.protocol_code_sequence;

-- A citizen client cannot set its own protocol number, municipality, status or
-- owner. This RPC derives them from the authenticated citizen profile in one
-- transaction and returns the server-issued protocol.
create or replace function public.create_occurrence(
  p_type_id text,
  p_description text,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_address text default null,
  p_neighborhood text default null,
  p_locality text default null,
  p_priority text default 'medium',
  p_agency text default null
)
returns table (occurrence_id uuid, protocol_code text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_citizen_id uuid := auth.uid();
  v_municipality_id uuid;
  v_protocol_id uuid;
  v_occurrence_id uuid;
  v_protocol_code text;
  v_created_at timestamptz := now();
begin
  if v_citizen_id is null then
    raise exception 'É necessário autenticar-se para criar uma ocorrência.' using errcode = '42501';
  end if;

  if nullif(trim(p_type_id), '') is null or nullif(trim(p_description), '') is null then
    raise exception 'Categoria e descrição são obrigatórias.' using errcode = '22023';
  end if;

  if length(trim(p_description)) > 5000 then
    raise exception 'A descrição excede o limite permitido.' using errcode = '22023';
  end if;

  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'Latitude e longitude devem ser informadas juntas.' using errcode = '22023';
  end if;

  if p_priority not in ('low', 'medium', 'high', 'critical') then
    raise exception 'Prioridade inválida.' using errcode = '22023';
  end if;

  select municipality_id
    into v_municipality_id
  from public.citizen_profiles
  where id = v_citizen_id;

  if v_municipality_id is null then
    raise exception 'Selecione um município ativo no seu perfil antes de criar uma ocorrência.' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.municipalities
    where id = v_municipality_id and status = 'active'
  ) then
    raise exception 'O município associado ao seu perfil não está ativo.' using errcode = 'P0001';
  end if;

  v_protocol_code := format(
    '#%s-%s',
    to_char(v_created_at, 'YYYY'),
    lpad(nextval('public.protocol_code_sequence')::text, 6, '0')
  );

  insert into public.protocols (
    protocol_code, citizen_id, municipality_id, category, subject, description, created_at
  )
  values (
    v_protocol_code, v_citizen_id, v_municipality_id, 'occurrence', trim(p_type_id), trim(p_description), v_created_at
  )
  returning id into v_protocol_id;

  insert into public.occurrences (
    citizen_id, municipality_id, protocol_id, type_id, description, latitude,
    longitude, address, neighborhood, locality, priority, agency, created_at
  )
  values (
    v_citizen_id, v_municipality_id, v_protocol_id, trim(p_type_id), trim(p_description), p_latitude,
    p_longitude, nullif(trim(p_address), ''), nullif(trim(p_neighborhood), ''),
    nullif(trim(p_locality), ''), p_priority, nullif(trim(p_agency), ''), v_created_at
  )
  returning id into v_occurrence_id;

  return query select v_occurrence_id, v_protocol_code, v_created_at;
end;
$$;

create or replace function public.confirm_occurrence(p_occurrence_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_citizen_id uuid := auth.uid();
  v_citizen_municipality_id uuid;
  v_occurrence_municipality_id uuid;
  v_inserted_count integer := 0;
  v_count integer;
begin
  if v_citizen_id is null then
    raise exception 'É necessário autenticar-se para confirmar uma ocorrência.' using errcode = '42501';
  end if;

  select municipality_id into v_citizen_municipality_id
  from public.citizen_profiles where id = v_citizen_id;

  select municipality_id into v_occurrence_municipality_id
  from public.occurrences where id = p_occurrence_id;

  if v_citizen_municipality_id is null
    or v_occurrence_municipality_id is null
    or v_citizen_municipality_id <> v_occurrence_municipality_id then
    raise exception 'Você só pode confirmar ocorrências do seu município.' using errcode = '42501';
  end if;

  insert into public.occurrence_confirmations (occurrence_id, citizen_id)
  values (p_occurrence_id, v_citizen_id)
  on conflict (occurrence_id, citizen_id) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count > 0 then
    update public.occurrences
    set confirmations_count = confirmations_count + 1
    where id = p_occurrence_id;
  end if;

  select confirmations_count into v_count
  from public.occurrences where id = p_occurrence_id;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.create_occurrence(text, text, numeric, numeric, text, text, text, text, text) from public, anon;
revoke all on function public.confirm_occurrence(uuid) from public, anon;
grant execute on function public.create_occurrence(text, text, numeric, numeric, text, text, text, text, text) to authenticated;
grant execute on function public.confirm_occurrence(uuid) to authenticated;

alter table public.municipalities enable row level security;
alter table public.citizen_profiles enable row level security;
alter table public.protocols enable row level security;
alter table public.occurrences enable row level security;
alter table public.occurrence_media enable row level security;
alter table public.occurrence_confirmations enable row level security;
alter table public.city_feed enable row level security;
alter table public.city_events enable row level security;

revoke all on table public.municipalities, public.citizen_profiles, public.protocols,
  public.occurrences, public.occurrence_media, public.occurrence_confirmations,
  public.city_feed, public.city_events from anon, authenticated;

grant select on public.municipalities to anon, authenticated;
grant select, insert, update on public.citizen_profiles to authenticated;
grant select on public.protocols, public.occurrences, public.occurrence_media,
  public.occurrence_confirmations to authenticated;
grant insert, delete on public.occurrence_media to authenticated;
grant select on public.city_feed, public.city_events to anon, authenticated;

drop policy if exists municipalities_read_active on public.municipalities;
create policy municipalities_read_active on public.municipalities
for select to anon, authenticated
using (status = 'active');

drop policy if exists citizens_read_own_profile on public.citizen_profiles;
create policy citizens_read_own_profile on public.citizen_profiles
for select to authenticated
using (id = (select auth.uid()));

drop policy if exists citizens_create_own_profile on public.citizen_profiles;
create policy citizens_create_own_profile on public.citizen_profiles
for insert to authenticated
with check (id = (select auth.uid()));

drop policy if exists citizens_update_own_profile on public.citizen_profiles;
create policy citizens_update_own_profile on public.citizen_profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists citizens_read_own_protocols on public.protocols;
create policy citizens_read_own_protocols on public.protocols
for select to authenticated
using (citizen_id = (select auth.uid()));

drop policy if exists citizens_read_own_occurrences on public.occurrences;
create policy citizens_read_own_occurrences on public.occurrences
for select to authenticated
using (citizen_id = (select auth.uid()));

drop policy if exists citizens_read_own_occurrence_media on public.occurrence_media;
create policy citizens_read_own_occurrence_media on public.occurrence_media
for select to authenticated
using (
  exists (
    select 1 from public.occurrences o
    where o.id = occurrence_id and o.citizen_id = (select auth.uid())
  )
);

drop policy if exists citizens_add_own_occurrence_media on public.occurrence_media;
create policy citizens_add_own_occurrence_media on public.occurrence_media
for insert to authenticated
with check (
  (storage.foldername(storage_path))[1] = (select auth.uid()::text)
  and exists (
    select 1 from public.occurrences o
    where o.id = occurrence_id
      and o.citizen_id = (select auth.uid())
      and (storage.foldername(storage_path))[2] = o.id::text
  )
);

drop policy if exists citizens_delete_own_occurrence_media on public.occurrence_media;
create policy citizens_delete_own_occurrence_media on public.occurrence_media
for delete to authenticated
using (
  exists (
    select 1 from public.occurrences o
    where o.id = occurrence_id and o.citizen_id = (select auth.uid())
  )
);

drop policy if exists citizens_read_own_confirmations on public.occurrence_confirmations;
create policy citizens_read_own_confirmations on public.occurrence_confirmations
for select to authenticated
using (citizen_id = (select auth.uid()));

drop policy if exists public_reads_current_city_feed on public.city_feed;
create policy public_reads_current_city_feed on public.city_feed
for select to anon, authenticated
using (
  published_at is not null
  and published_at <= now()
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists public_reads_current_city_events on public.city_events;
create policy public_reads_current_city_events on public.city_events
for select to anon, authenticated
using (published_at is not null and published_at <= now());

-- Private buckets: authenticated citizens can access only objects owned by
-- their user-id folder and media tied to their own occurrence.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'occurrence-media',
  'occurrence-media',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'citizen-avatars',
  'citizen-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists citizens_read_own_occurrence_objects on storage.objects;
create policy citizens_read_own_occurrence_objects on storage.objects
for select to authenticated
using (
  bucket_id = 'occurrence-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1 from public.occurrences o
    where o.citizen_id = (select auth.uid())
      and o.id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists citizens_upload_own_occurrence_objects on storage.objects;
create policy citizens_upload_own_occurrence_objects on storage.objects
for insert to authenticated
with check (
  bucket_id = 'occurrence-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1 from public.occurrences o
    where o.citizen_id = (select auth.uid())
      and o.id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists citizens_delete_own_occurrence_objects on storage.objects;
create policy citizens_delete_own_occurrence_objects on storage.objects
for delete to authenticated
using (
  bucket_id = 'occurrence-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists citizens_read_own_avatar_objects on storage.objects;
create policy citizens_read_own_avatar_objects on storage.objects
for select to authenticated
using (
  bucket_id = 'citizen-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists citizens_upload_own_avatar_objects on storage.objects;
create policy citizens_upload_own_avatar_objects on storage.objects
for insert to authenticated
with check (
  bucket_id = 'citizen-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists citizens_update_own_avatar_objects on storage.objects;
create policy citizens_update_own_avatar_objects on storage.objects
for update to authenticated
using (
  bucket_id = 'citizen-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'citizen-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists citizens_delete_own_avatar_objects on storage.objects;
create policy citizens_delete_own_avatar_objects on storage.objects
for delete to authenticated
using (
  bucket_id = 'citizen-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
