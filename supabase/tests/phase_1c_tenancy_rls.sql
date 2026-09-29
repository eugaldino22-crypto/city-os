\set ON_ERROR_STOP on

-- Fase 1C: executable local-only tenancy/RLS proof.
-- Run with:
-- docker exec -i supabase_db_city-os psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < supabase/tests/phase_1c_tenancy_rls.sql
-- Every fixture is fictitious and the transaction is rolled back at the end.

begin;

-- Fixed UUIDs make the test deterministic without putting credentials in the repository.
delete from auth.users
where id in (
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000013'
);

delete from public.municipalities
where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003'
);

insert into public.municipalities (id, name, state, ibge_code, status)
values
  ('00000000-0000-4000-8000-000000000001', 'Município Fase 1C A', 'TS', '0000001', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'Município Fase 1C B', 'TS', '0000002', 'active'),
  ('00000000-0000-4000-8000-000000000003', 'Município Fase 1C Inativo', 'TS', '0000003', 'inactive');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000011',
    'authenticated',
    'authenticated',
    'phase1c-citizen-a@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Citizen A"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000012',
    'authenticated',
    'authenticated',
    'phase1c-citizen-b@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Citizen B"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000013',
    'authenticated',
    'authenticated',
    'phase1c-citizen-c@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Citizen C"}',
    now(),
    now()
  );

do $$
begin
  if (select count(*) from public.citizen_profiles where id in (
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000013'
  )) <> 3 then
    raise exception 'FAIL fixture: auth trigger did not create all citizen profiles';
  end if;
end;
$$;

-- ONBOARDING: first binding succeeds; inactive, nonexistent and second bindings fail.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

do $$
begin
  perform public.link_current_citizen_municipality('00000000-0000-4000-8000-000000000001');

  if (select municipality_id from public.citizen_profiles where id = auth.uid())
       <> '00000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'FAIL onboarding: first municipal binding was not persisted';
  end if;

  begin
    perform public.link_current_citizen_municipality('00000000-0000-4000-8000-000000000002');
    raise exception 'FAIL onboarding: a second municipal binding was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);
select public.link_current_citizen_municipality('00000000-0000-4000-8000-000000000002');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000013', true);

do $$
begin
  begin
    perform public.link_current_citizen_municipality('00000000-0000-4000-8000-000000000003');
    raise exception 'FAIL onboarding: inactive municipality was accepted';
  exception
    when data_exception then null;
  end;

  begin
    perform public.link_current_citizen_municipality('00000000-0000-4000-8000-000000000099');
    raise exception 'FAIL onboarding: nonexistent municipality was accepted';
  exception
    when data_exception then null;
  end;

  if (select municipality_id from public.citizen_profiles where id = auth.uid()) is not null then
    raise exception 'FAIL onboarding: invalid binding changed the canonical municipality';
  end if;
end;
$$;

-- PROFILE: own read/update is allowed. Cross-user access, direct municipal change,
-- upsert tampering and forged user identity are blocked by RLS and the trigger.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

do $$
declare
  v_count bigint;
  v_rows bigint;
begin
  if auth.uid() <> '00000000-0000-4000-8000-000000000011'::uuid then
    raise exception 'FAIL profile: auth.uid did not resolve citizen A';
  end if;

  select count(*) into v_count from public.citizen_profiles;
  if v_count <> 1 then
    raise exception 'FAIL profile: citizen A did not read exactly one own profile, got %', v_count;
  end if;

  select count(*) into v_count
  from public.citizen_profiles
  where id = '00000000-0000-4000-8000-000000000012';
  if v_count <> 0 then
    raise exception 'FAIL profile: citizen A read citizen B profile';
  end if;

  update public.citizen_profiles
  set full_name = 'Citizen A updated locally'
  where id = auth.uid();
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'FAIL profile: own permitted update did not affect one row';
  end if;

  begin
    update public.citizen_profiles
    set municipality_id = '00000000-0000-4000-8000-000000000002'
    where id = auth.uid();
    raise exception 'FAIL profile: direct municipality change was accepted';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.citizen_profiles (id, full_name, municipality_id)
    values (
      auth.uid(),
      'Citizen A upsert attack',
      '00000000-0000-4000-8000-000000000002'
    )
    on conflict (id) do update
    set municipality_id = excluded.municipality_id;
    raise exception 'FAIL profile: upsert municipality change was accepted';
  exception
    when insufficient_privilege then null;
  end;

  update public.citizen_profiles
  set full_name = 'Cross-user update attack'
  where id = '00000000-0000-4000-8000-000000000012';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'FAIL profile: citizen A updated citizen B profile';
  end if;

  begin
    insert into public.citizen_profiles (id, full_name)
    values ('00000000-0000-4000-8000-000000000012', 'Forged citizen B');
    raise exception 'FAIL profile: citizen A created a profile for citizen B';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.citizen_profiles;
  if v_count <> 1 then
    raise exception 'FAIL profile inverse: citizen B did not read exactly one own profile';
  end if;

  select count(*) into v_count
  from public.citizen_profiles
  where id = '00000000-0000-4000-8000-000000000011';
  if v_count <> 0 then
    raise exception 'FAIL profile inverse: citizen B read citizen A profile';
  end if;
end;
$$;

-- OCCURRENCES: function input cannot carry tenant, owner, priority, agency or
-- administrative state. The function derives citizen and municipality from auth.uid().
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);
select * from public.create_occurrence(
  'buraco',
  'Phase 1C occurrence private A',
  -10.1234,
  -37.9874,
  'Rua privada A',
  'Bairro A',
  'Localidade A'
);

reset role;
select set_config(
  'app.phase_1c_occurrence_a',
  (select id::text from public.occurrences where description = 'Phase 1C occurrence private A'),
  true
);
select set_config(
  'app.phase_1c_protocol_a',
  (select protocol_id::text from public.occurrences where description = 'Phase 1C occurrence private A'),
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);
select * from public.create_occurrence(
  'lixo',
  'Phase 1C occurrence private B',
  -11.4321,
  -38.1234,
  'Rua privada B',
  'Bairro B',
  'Localidade B'
);

reset role;
select set_config(
  'app.phase_1c_occurrence_b',
  (select id::text from public.occurrences where description = 'Phase 1C occurrence private B'),
  true
);
select set_config(
  'app.phase_1c_protocol_b',
  (select protocol_id::text from public.occurrences where description = 'Phase 1C occurrence private B'),
  true
);

do $$
begin
  if not exists (
    select 1
    from public.occurrences
    where id = current_setting('app.phase_1c_occurrence_a')::uuid
      and citizen_id = '00000000-0000-4000-8000-000000000011'
      and municipality_id = '00000000-0000-4000-8000-000000000001'
      and priority = 'medium'
      and agency is null
      and status = 'received'
  ) then
    raise exception 'FAIL occurrence: A did not receive backend-derived owner, tenant and defaults';
  end if;

  if not exists (
    select 1
    from public.occurrences
    where id = current_setting('app.phase_1c_occurrence_b')::uuid
      and citizen_id = '00000000-0000-4000-8000-000000000012'
      and municipality_id = '00000000-0000-4000-8000-000000000002'
      and priority = 'medium'
      and agency is null
      and status = 'received'
  ) then
    raise exception 'FAIL occurrence: B did not receive backend-derived owner, tenant and defaults';
  end if;

  if exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'create_occurrence'
      and proc.proargnames && array[
        'p_priority',
        'p_agency',
        'p_citizen_id',
        'p_user_id',
        'p_municipality_id',
        'p_department_id',
        'p_owner_id',
        'p_status'
      ]
  ) then
    raise exception 'FAIL occurrence: create_occurrence exposes a sensitive client-controlled parameter';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

do $$
declare
  v_count bigint;
begin
  begin
    perform public.create_occurrence(
      'buraco'::text,
      'sensitive parameter attack'::text,
      null::numeric,
      null::numeric,
      null::text,
      null::text,
      null::text,
      'critical'::text,
      'attacker-agency'::text
    );
    raise exception 'FAIL occurrence: obsolete priority/agency parameters were accepted';
  exception
    when undefined_function then null;
  end;

  select count(*) into v_count
  from public.occurrences
  where id = current_setting('app.phase_1c_occurrence_a')::uuid;
  if v_count <> 1 then
    raise exception 'FAIL occurrence: citizen A cannot read own occurrence';
  end if;

  select count(*) into v_count
  from public.occurrences
  where id = current_setting('app.phase_1c_occurrence_b')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL occurrence: citizen A read private occurrence B';
  end if;

  select count(*) into v_count
  from public.protocols
  where id = current_setting('app.phase_1c_protocol_a')::uuid;
  if v_count <> 1 then
    raise exception 'FAIL protocol: citizen A cannot read own protocol';
  end if;

  select count(*) into v_count
  from public.protocols
  where id = current_setting('app.phase_1c_protocol_b')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL protocol: citizen A read private protocol B';
  end if;

  begin
    update public.occurrences
    set status = 'resolved'
    where id = current_setting('app.phase_1c_occurrence_a')::uuid;
    raise exception 'FAIL occurrence: citizen A changed administrative status';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.protocols
    set status = 'resolved', municipality_id = '00000000-0000-4000-8000-000000000002'
    where id = current_setting('app.phase_1c_protocol_a')::uuid;
    raise exception 'FAIL protocol: citizen A changed administrative protocol fields';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count
  from public.occurrences
  where id = current_setting('app.phase_1c_occurrence_b')::uuid;
  if v_count <> 1 then
    raise exception 'FAIL occurrence inverse: citizen B cannot read own occurrence';
  end if;

  select count(*) into v_count
  from public.occurrences
  where id = current_setting('app.phase_1c_occurrence_a')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL occurrence inverse: citizen B read private occurrence A';
  end if;

  select count(*) into v_count
  from public.protocols
  where id = current_setting('app.phase_1c_protocol_b')::uuid;
  if v_count <> 1 then
    raise exception 'FAIL protocol inverse: citizen B cannot read own protocol';
  end if;

  select count(*) into v_count
  from public.protocols
  where id = current_setting('app.phase_1c_protocol_a')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL protocol inverse: citizen B read private protocol A';
  end if;
end;
$$;

-- FEED/EVENTS: direct table access is revoked; the RPC resolves the tenant
-- from the authenticated profile and rejects a forged explicit tenant.
reset role;
insert into public.city_feed (municipality_id, kind, title, description, published_at)
values
  ('00000000-0000-4000-8000-000000000001', 'notice', 'Feed Phase 1C A', 'Public A', now()),
  ('00000000-0000-4000-8000-000000000002', 'notice', 'Feed Phase 1C B', 'Public B', now());

insert into public.city_events (municipality_id, title, description, location, starts_at, published_at)
values
  ('00000000-0000-4000-8000-000000000001', 'Evento Phase 1C A', 'Public A', 'Praça A', now() + interval '1 day', now()),
  ('00000000-0000-4000-8000-000000000002', 'Evento Phase 1C B', 'Public B', 'Praça B', now() + interval '1 day', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.list_municipal_city_feed();
  if v_count <> 1 then
    raise exception 'FAIL feed: citizen A did not receive exactly tenant A';
  end if;

  select count(*) into v_count from public.list_municipal_city_events();
  if v_count <> 1 then
    raise exception 'FAIL events: citizen A did not receive exactly tenant A';
  end if;

  begin
    perform public.list_municipal_city_feed('00000000-0000-4000-8000-000000000002');
    raise exception 'FAIL feed: citizen A forged tenant B with an explicit parameter';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.list_municipal_city_events('00000000-0000-4000-8000-000000000002');
    raise exception 'FAIL events: citizen A forged tenant B with an explicit parameter';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.list_municipal_city_feed();
  if v_count <> 1 then
    raise exception 'FAIL feed inverse: citizen B did not receive exactly tenant B';
  end if;

  select count(*) into v_count from public.list_municipal_city_events();
  if v_count <> 1 then
    raise exception 'FAIL events inverse: citizen B did not receive exactly tenant B';
  end if;
end;
$$;

-- MAP: exact, tenant-scoped projection is inspected as JSON so private fields
-- cannot silently enter the RPC result.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

do $$
declare
  v_map jsonb;
  v_count bigint;
  v_reported_at timestamptz;
begin
  select to_jsonb(map) into v_map
  from public.list_municipal_occurrence_map() as map
  where map.occurrence_id = current_setting('app.phase_1c_occurrence_a')::uuid;

  if v_map is null then
    raise exception 'FAIL map: citizen A did not receive its municipal occurrence projection';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(v_map) as key
    where key not in (
      'occurrence_id',
      'type_id',
      'latitude',
      'longitude',
      'priority',
      'status',
      'confirmations_count',
      'reported_at'
    )
  ) then
    raise exception 'FAIL map: sanitized projection contains an unexpected column: %', v_map;
  end if;

  if v_map ?| array[
    'citizen_id', 'user_id', 'full_name', 'name', 'email', 'phone', 'description',
    'address', 'neighborhood', 'locality', 'media', 'metadata', 'notes', 'agency',
    'department_id', 'owner_id'
  ] then
    raise exception 'FAIL map: sanitized projection exposed private data: %', v_map;
  end if;

  if (v_map ->> 'latitude')::numeric <> -10.123
    or (v_map ->> 'longitude')::numeric <> -37.987 then
    raise exception 'FAIL map: coordinates were not rounded to three decimals: %', v_map;
  end if;

  select reported_at into v_reported_at
  from public.list_municipal_occurrence_map()
  where occurrence_id = current_setting('app.phase_1c_occurrence_a')::uuid;
  if v_reported_at <> date_trunc('hour', (
    select created_at from public.occurrences
    where id = current_setting('app.phase_1c_occurrence_a')::uuid
  )) then
    raise exception 'FAIL map: reported_at was not rounded to the hour';
  end if;

  select count(*) into v_count
  from public.list_municipal_occurrence_map()
  where occurrence_id = current_setting('app.phase_1c_occurrence_b')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL map: citizen A received occurrence B';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count
  from public.list_municipal_occurrence_map()
  where occurrence_id = current_setting('app.phase_1c_occurrence_b')::uuid;
  if v_count <> 1 then
    raise exception 'FAIL map inverse: citizen B did not receive occurrence B';
  end if;

  select count(*) into v_count
  from public.list_municipal_occurrence_map()
  where occurrence_id = current_setting('app.phase_1c_occurrence_a')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL map inverse: citizen B received occurrence A';
  end if;
end;
$$;

-- ANON: private functions and tables are unavailable. Public content requires
-- an explicit municipality and returns only public feed/event fields.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
declare
  v_count bigint;
begin
  begin
    perform public.list_municipal_occurrence_map();
    raise exception 'FAIL anon: private map RPC was callable';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.create_occurrence('buraco', 'anon attack');
    raise exception 'FAIL anon: private occurrence RPC was callable';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.link_current_citizen_municipality('00000000-0000-4000-8000-000000000001');
    raise exception 'FAIL anon: onboarding RPC was callable';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform (select count(*) from public.city_feed);
    raise exception 'FAIL anon: direct city_feed table read was allowed';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform (select count(*) from public.citizen_profiles);
    raise exception 'FAIL anon: private profile table read was allowed';
  exception
    when insufficient_privilege then null;
  end;

  select count(*) into v_count
  from public.list_municipal_city_feed('00000000-0000-4000-8000-000000000001');
  if v_count <> 1 then
    raise exception 'FAIL anon: explicit public feed did not return tenant A public record';
  end if;

  select count(*) into v_count
  from public.list_municipal_city_events('00000000-0000-4000-8000-000000000002');
  if v_count <> 1 then
    raise exception 'FAIL anon: explicit public events did not return tenant B public record';
  end if;
end;
$$;

reset role;

do $$
begin
  if has_function_privilege('anon', 'public.list_municipal_occurrence_map()', 'EXECUTE')
    or has_function_privilege('anon', 'public.create_occurrence(text, text, numeric, numeric, text, text, text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.link_current_citizen_municipality(uuid)', 'EXECUTE') then
    raise exception 'FAIL grants: anon has a private RPC grant';
  end if;

  if not has_function_privilege('anon', 'public.list_municipal_city_feed(uuid)', 'EXECUTE')
    or not has_function_privilege('anon', 'public.list_municipal_city_events(uuid)', 'EXECUTE') then
    raise exception 'FAIL grants: explicit public municipal content RPC is not available to anon';
  end if;

  if has_table_privilege('authenticated', 'public.occurrences', 'UPDATE')
    or has_table_privilege('authenticated', 'public.protocols', 'UPDATE') then
    raise exception 'FAIL grants: citizen can update an administrative operational table directly';
  end if;
end;
$$;

rollback;
\echo 'PASS: Phase 1C local tenancy/RLS matrix completed and fixtures rolled back.'
