-- City OS: Fase 1B — municipal tenancy and RLS hardening.
--
-- This is intentionally forward-only. The real-data foundation migration is
-- retained unchanged so existing deployments preserve their migration history.

-- Resolve the canonical tenant only from the authenticated profile. This
-- helper is used by authenticated RPCs and profile RLS; it never accepts a
-- municipality identifier supplied by a browser.
create or replace function public.current_citizen_municipality_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.municipality_id
  from public.citizen_profiles as profile
  where profile.id = auth.uid();
$$;

revoke all on function public.current_citizen_municipality_id() from public, anon;
grant execute on function public.current_citizen_municipality_id() to authenticated;

-- Municipality binding is a one-time onboarding action. The transaction-local
-- flag can only be set by link_current_citizen_municipality below; PostgREST
-- clients have no direct SQL channel to set it.
create or replace function public.enforce_citizen_municipality_binding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.municipality_id is not null
    and old.municipality_id is distinct from new.municipality_id then
    raise exception 'O município canônico do cidadão não pode ser alterado diretamente.'
      using errcode = '42501';
  end if;

  if old.municipality_id is distinct from new.municipality_id
    and coalesce(current_setting('app.cityos_municipality_binding', true), '') <> 'on' then
    raise exception 'Use o fluxo de vínculo inicial para definir o município do cidadão.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists citizen_profiles_enforce_municipality_binding on public.citizen_profiles;
create trigger citizen_profiles_enforce_municipality_binding
before update on public.citizen_profiles
for each row execute function public.enforce_citizen_municipality_binding();

drop policy if exists citizens_create_own_profile on public.citizen_profiles;
create policy citizens_create_own_profile on public.citizen_profiles
for insert to authenticated
with check (
  id = (select auth.uid())
  and municipality_id is null
);

drop policy if exists citizens_update_own_profile on public.citizen_profiles;
create policy citizens_update_own_profile on public.citizen_profiles
for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and municipality_id is not distinct from public.current_citizen_municipality_id()
);

create or replace function public.link_current_citizen_municipality(p_municipality_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_citizen_id uuid := auth.uid();
  v_current_municipality_id uuid;
begin
  if v_citizen_id is null then
    raise exception 'É necessário autenticar-se para vincular um município.' using errcode = '42501';
  end if;

  if p_municipality_id is null then
    raise exception 'Selecione um município para continuar.' using errcode = '22023';
  end if;

  select profile.municipality_id
    into v_current_municipality_id
  from public.citizen_profiles as profile
  where profile.id = v_citizen_id
  for update;

  if not found then
    raise exception 'O perfil do cidadão não foi encontrado.' using errcode = 'P0001';
  end if;

  if v_current_municipality_id is not null then
    raise exception 'O município canônico já foi definido e não pode ser alterado diretamente.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.municipalities as municipality
    where municipality.id = p_municipality_id
      and municipality.status = 'active'
  ) then
    raise exception 'O município selecionado não está ativo.' using errcode = '22023';
  end if;

  perform set_config('app.cityos_municipality_binding', 'on', true);

  update public.citizen_profiles
  set municipality_id = p_municipality_id
  where id = v_citizen_id;

  return p_municipality_id;
end;
$$;

revoke all on function public.link_current_citizen_municipality(uuid) from public, anon;
grant execute on function public.link_current_citizen_municipality(uuid) to authenticated;

-- Occurrence priority and routing are server-owned. Citizens can only send the
-- descriptive and location fields required to open a protocol.
alter table public.occurrences
  alter column priority set default 'medium';

drop function if exists public.create_occurrence(text, text, numeric, numeric, text, text, text, text, text);

create function public.create_occurrence(
  p_type_id text,
  p_description text,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_address text default null,
  p_neighborhood text default null,
  p_locality text default null
)
returns table (
  occurrence_id uuid,
  protocol_code text,
  priority text,
  agency text,
  created_at timestamptz
)
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
  v_priority text;
  v_agency text;
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

  v_municipality_id := public.current_citizen_municipality_id();

  if v_municipality_id is null then
    raise exception 'Selecione um município ativo no seu perfil antes de criar uma ocorrência.' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.municipalities as municipality
    where municipality.id = v_municipality_id
      and municipality.status = 'active'
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

  insert into public.occurrences as occurrence (
    citizen_id, municipality_id, protocol_id, type_id, description, latitude,
    longitude, address, neighborhood, locality, created_at
  )
  values (
    v_citizen_id, v_municipality_id, v_protocol_id, trim(p_type_id), trim(p_description), p_latitude,
    p_longitude, nullif(trim(p_address), ''), nullif(trim(p_neighborhood), ''),
    nullif(trim(p_locality), ''), v_created_at
  )
  returning occurrence.id, occurrence.priority, occurrence.agency
    into v_occurrence_id, v_priority, v_agency;

  return query select v_occurrence_id, v_protocol_code, v_priority, v_agency, v_created_at;
end;
$$;

revoke all on function public.create_occurrence(text, text, numeric, numeric, text, text, text) from public, anon;
grant execute on function public.create_occurrence(text, text, numeric, numeric, text, text, text) to authenticated;

-- Resolve municipal public content without ever letting an authenticated caller
-- select another tenant. Anonymous access is deliberately limited to a future
-- explicit municipality context; no public navigation is introduced here.
create or replace function public.resolve_municipal_content_municipality(p_municipality_id uuid default null)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_citizen_id uuid := auth.uid();
  v_profile_municipality_id uuid;
begin
  if v_citizen_id is not null then
    v_profile_municipality_id := public.current_citizen_municipality_id();

    if v_profile_municipality_id is null then
      raise exception 'O cidadão não possui município canônico vinculado.' using errcode = '42501';
    end if;

    if p_municipality_id is not null and p_municipality_id <> v_profile_municipality_id then
      raise exception 'O conteúdo municipal autenticado é definido pelo município do perfil.'
        using errcode = '42501';
    end if;

    return v_profile_municipality_id;
  end if;

  if p_municipality_id is null then
    raise exception 'O contexto explícito do município é obrigatório para acesso público.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.municipalities as municipality
    where municipality.id = p_municipality_id
      and municipality.status = 'active'
  ) then
    raise exception 'O município solicitado não está ativo.' using errcode = '22023';
  end if;

  return p_municipality_id;
end;
$$;

revoke all on function public.resolve_municipal_content_municipality(uuid) from public, anon, authenticated;

revoke select on table public.city_feed, public.city_events from anon, authenticated;
drop policy if exists public_reads_current_city_feed on public.city_feed;
drop policy if exists public_reads_current_city_events on public.city_events;

create or replace function public.list_municipal_city_feed(p_municipality_id uuid default null)
returns table (
  id uuid,
  kind text,
  title text,
  description text,
  image_path text,
  link_url text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_municipality_id uuid := public.resolve_municipal_content_municipality(p_municipality_id);
begin
  return query
  select feed.id, feed.kind, feed.title, feed.description, feed.image_path,
    feed.link_url, feed.published_at, feed.starts_at, feed.ends_at, feed.created_at
  from public.city_feed as feed
  where feed.municipality_id = v_municipality_id
    and feed.published_at is not null
    and feed.published_at <= now()
    and (feed.starts_at is null or feed.starts_at <= now())
    and (feed.ends_at is null or feed.ends_at >= now())
  order by feed.published_at desc, feed.created_at desc;
end;
$$;

create or replace function public.list_municipal_city_events(p_municipality_id uuid default null)
returns table (
  id uuid,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  image_path text,
  link_url text,
  published_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_municipality_id uuid := public.resolve_municipal_content_municipality(p_municipality_id);
begin
  return query
  select event.id, event.title, event.description, event.location, event.starts_at,
    event.ends_at, event.image_path, event.link_url, event.published_at, event.created_at
  from public.city_events as event
  where event.municipality_id = v_municipality_id
    and event.published_at is not null
    and event.published_at <= now()
  order by event.starts_at asc, event.created_at desc;
end;
$$;

revoke all on function public.list_municipal_city_feed(uuid) from public;
revoke all on function public.list_municipal_city_events(uuid) from public;
grant execute on function public.list_municipal_city_feed(uuid) to anon, authenticated;
grant execute on function public.list_municipal_city_events(uuid) to anon, authenticated;

-- The operational table stays private under its ownership RLS policy. This is
-- the only municipal map/feed projection, with rounded location and time and
-- without citizen identity, contact data, description, media, private metadata
-- or internal assignment fields.
create or replace function public.list_municipal_occurrence_map()
returns table (
  occurrence_id uuid,
  type_id text,
  latitude numeric,
  longitude numeric,
  priority text,
  status text,
  confirmations_count integer,
  reported_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select occurrence.id,
    occurrence.type_id,
    round(occurrence.latitude, 3),
    round(occurrence.longitude, 3),
    occurrence.priority,
    occurrence.status,
    occurrence.confirmations_count,
    date_trunc('hour', occurrence.created_at)
  from public.occurrences as occurrence
  where occurrence.municipality_id = public.current_citizen_municipality_id()
    and occurrence.latitude is not null
    and occurrence.longitude is not null
  order by occurrence.created_at desc;
$$;

revoke all on function public.list_municipal_occurrence_map() from public, anon;
grant execute on function public.list_municipal_occurrence_map() to authenticated;
