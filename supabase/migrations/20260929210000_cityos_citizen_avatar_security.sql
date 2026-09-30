-- City OS: secure, private citizen avatars.
--
-- The original foundation migration already created citizen-avatars. This
-- forward-only hardening migration preserves that bucket and makes the
-- supported object contract explicit: {auth.uid()}/avatar.{jpg|jpeg|png|webp}.

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

-- A citizen may only ever access the canonical avatar filename in their own
-- first-level folder. The service_role keeps its normal RLS bypass behaviour.
drop policy if exists citizens_read_own_avatar_objects on storage.objects;
create policy citizens_read_own_avatar_objects on storage.objects
for select to authenticated
using (
  bucket_id = 'citizen-avatars'
  and storage.foldername(name) = array[(select auth.uid()::text)]
  and storage.filename(name) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
);

drop policy if exists citizens_upload_own_avatar_objects on storage.objects;
create policy citizens_upload_own_avatar_objects on storage.objects
for insert to authenticated
with check (
  bucket_id = 'citizen-avatars'
  and storage.foldername(name) = array[(select auth.uid()::text)]
  and storage.filename(name) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
);

drop policy if exists citizens_update_own_avatar_objects on storage.objects;
create policy citizens_update_own_avatar_objects on storage.objects
for update to authenticated
using (
  bucket_id = 'citizen-avatars'
  and storage.foldername(name) = array[(select auth.uid()::text)]
  and storage.filename(name) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
)
with check (
  bucket_id = 'citizen-avatars'
  and storage.foldername(name) = array[(select auth.uid()::text)]
  and storage.filename(name) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
);

drop policy if exists citizens_delete_own_avatar_objects on storage.objects;
create policy citizens_delete_own_avatar_objects on storage.objects
for delete to authenticated
using (
  bucket_id = 'citizen-avatars'
  and storage.foldername(name) = array[(select auth.uid()::text)]
  and storage.filename(name) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
);

-- citizen_profiles.avatar_path remains the only persisted avatar reference.
-- An authenticated caller cannot point their profile at another citizen's
-- folder even if they bypass the browser's allowlist.
create or replace function public.enforce_citizen_avatar_path()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_citizen_id uuid := auth.uid();
begin
  if new.avatar_path is distinct from old.avatar_path
    and v_citizen_id is not null
    and new.avatar_path is not null
    and new.avatar_path not in (
      v_citizen_id::text || '/avatar.jpg',
      v_citizen_id::text || '/avatar.jpeg',
      v_citizen_id::text || '/avatar.png',
      v_citizen_id::text || '/avatar.webp'
    ) then
    raise exception 'O avatar deve pertencer à pasta do cidadão autenticado.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists citizen_profiles_enforce_avatar_path on public.citizen_profiles;
create trigger citizen_profiles_enforce_avatar_path
before update of avatar_path on public.citizen_profiles
for each row execute function public.enforce_citizen_avatar_path();
