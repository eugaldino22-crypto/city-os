\set ON_ERROR_STOP on

-- Fase 1D: executable local-only profile and private-avatar security proof.
-- Run with:
-- docker exec -i supabase_db_city-os psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < supabase/tests/phase_1d_profile_avatar.sql
-- Fixtures are fictitious and are rolled back at the end.

begin;

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
    '00000000-0000-4000-8000-000000000041',
    'authenticated',
    'authenticated',
    'phase1d-avatar-a@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Avatar Citizen A"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000042',
    'authenticated',
    'authenticated',
    'phase1d-avatar-b@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Avatar Citizen B"}',
    now(),
    now()
  );

do $$
declare
  v_count integer;
begin
  if (select count(*) from public.citizen_profiles where id in (
    '00000000-0000-4000-8000-000000000041',
    '00000000-0000-4000-8000-000000000042'
  )) <> 2 then
    raise exception 'FAIL fixture: auth trigger did not create citizen profiles';
  end if;

  if (select public from storage.buckets where id = 'citizen-avatars') then
    raise exception 'FAIL bucket: citizen-avatars must be private';
  end if;

  if (select file_size_limit from storage.buckets where id = 'citizen-avatars') <> 5242880 then
    raise exception 'FAIL bucket: avatar limit is not 5 MB';
  end if;

  if (select allowed_mime_types from storage.buckets where id = 'citizen-avatars')
       <> array['image/jpeg', 'image/png', 'image/webp'] then
    raise exception 'FAIL bucket: allowed avatar MIME types do not match the contract';
  end if;
end;
$$;

-- Profile: auth.uid() owns the only updateable profile and municipality stays
-- immutable. This simulates the same authenticated role used by PostgREST.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000041', true);

do $$
declare
  v_count integer;
begin
  update public.citizen_profiles
  set full_name = 'Avatar Citizen A updated locally'
  where id = auth.uid();
  get diagnostics v_count = row_count;

  if v_count <> 1 then
    raise exception 'FAIL profile: authenticated citizen could not save permitted fields';
  end if;

  update public.citizen_profiles
  set avatar_path = auth.uid()::text || '/avatar.png'
  where id = auth.uid();
  get diagnostics v_count = row_count;

  if v_count <> 1 then
    raise exception 'FAIL avatar path: citizen could not persist own canonical path';
  end if;

  begin
    update public.citizen_profiles
    set avatar_path = '00000000-0000-4000-8000-000000000042/avatar.png'
    where id = auth.uid();
    raise exception 'FAIL avatar path: citizen pointed profile at another user folder';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.citizen_profiles
    set avatar_path = auth.uid()::text || '/not-an-avatar.png'
    where id = auth.uid();
    raise exception 'FAIL avatar path: noncanonical filename was accepted';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.citizen_profiles
    set municipality_id = '00000000-0000-4000-8000-000000000099'
    where id = auth.uid();
    raise exception 'FAIL profile: municipality_id mutation was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

-- Storage: A can create and replace only their deterministic avatar object.
insert into storage.objects (bucket_id, name, owner, metadata)
values (
  'citizen-avatars',
  '00000000-0000-4000-8000-000000000041/avatar.png',
  auth.uid(),
  '{"mimetype":"image/png","size":1}'
);

do $$
declare
  v_count integer;
begin
  update storage.objects
  set metadata = metadata || '{"cacheControl":"3600"}'::jsonb
  where bucket_id = 'citizen-avatars'
    and name = auth.uid()::text || '/avatar.png';
  get diagnostics v_count = row_count;

  if v_count <> 1 then
    raise exception 'FAIL storage: citizen could not replace own avatar object';
  end if;

  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values (
      'citizen-avatars',
      auth.uid()::text || '/avatar.gif',
      auth.uid(),
      '{"mimetype":"image/gif","size":1}'
    );
    raise exception 'FAIL storage: noncanonical avatar extension was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000042', true);

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from storage.objects
  where bucket_id = 'citizen-avatars'
    and name = '00000000-0000-4000-8000-000000000041/avatar.png';

  if v_count <> 0 then
    raise exception 'FAIL storage: citizen B read citizen A avatar';
  end if;

  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values (
      'citizen-avatars',
      '00000000-0000-4000-8000-000000000041/avatar.png',
      auth.uid(),
      '{"mimetype":"image/png","size":1}'
    );
    raise exception 'FAIL storage: citizen B wrote to citizen A folder';
  exception
    when insufficient_privilege then null;
  end;

  update storage.objects
  set metadata = metadata || '{"attemptedBy":"citizen-b"}'::jsonb
  where bucket_id = 'citizen-avatars'
    and name = '00000000-0000-4000-8000-000000000041/avatar.png';
  get diagnostics v_count = row_count;

  if v_count <> 0 then
    raise exception 'FAIL storage: citizen B updated citizen A avatar';
  end if;

  -- storage.objects intentionally rejects direct table deletion even before a
  -- caller could remove a row. The Storage API is the supported delete path;
  -- the visibility assertion above proves citizen B cannot target A's object.
  begin
    delete from storage.objects
    where bucket_id = 'citizen-avatars'
      and name = '00000000-0000-4000-8000-000000000041/avatar.png';
    raise exception 'FAIL storage: direct object deletion unexpectedly succeeded';
  exception
    when others then
      if position('Direct deletion from storage tables is not allowed' in sqlerrm) = 0 then
        raise;
      end if;
  end;
end;
$$;

-- An anonymous caller has neither profile update nor avatar object access.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
declare
  v_count integer;
begin
  begin
    update public.citizen_profiles
    set full_name = 'anonymous mutation'
    where id = '00000000-0000-4000-8000-000000000041';
    raise exception 'FAIL anon: profile update was allowed';
  exception
    when insufficient_privilege then null;
  end;

  select count(*) into v_count from storage.objects where bucket_id = 'citizen-avatars';

  if v_count <> 0 then
    raise exception 'FAIL anon: avatar object listing was allowed';
  end if;
end;
$$;

rollback;

\echo 'PASS: Phase 1D local profile/avatar RLS matrix completed and fixtures rolled back.'
