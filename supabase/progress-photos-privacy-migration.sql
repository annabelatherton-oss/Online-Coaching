-- Makes progress photos private. The app now stores storage PATHS (not
-- public URLs) in client_checkins.progress_photos and the progress_photos
-- table, and generates short-lived signed URLs on demand whenever a photo
-- is displayed. This SQL is the other half of that change: it flips the
-- bucket to private and adds the RLS policies needed for uploads/reads to
-- keep working once it is.
--
-- Run in Supabase SQL Editor.

-- 1. Make the bucket private (was public — anyone with a photo's URL could
--    view it, forever, with no login check).
update storage.buckets set public = false where id = 'progress-photos';

-- 2. RLS on storage.objects for this bucket. Paths look like either
--    "checkins/{client_id}/week-N/angle-ts.jpg" (check-in photos) or
--    "{client_id}/ts-rand.jpg" (the standalone photo gallery) — this
--    expression pulls the client_id out of either shape.
--    coalesce(nullif(segment[1], 'checkins'), segment[2])

drop policy if exists "progress_photos_client_all" on storage.objects;
create policy "progress_photos_client_all" on storage.objects
  for all
  using (
    bucket_id = 'progress-photos'
    and coalesce(nullif((storage.foldername(name))[1], 'checkins'), (storage.foldername(name))[2])::uuid
        in (select id from clients where profile_id = auth.uid())
  )
  with check (
    bucket_id = 'progress-photos'
    and coalesce(nullif((storage.foldername(name))[1], 'checkins'), (storage.foldername(name))[2])::uuid
        in (select id from clients where profile_id = auth.uid())
  );

drop policy if exists "progress_photos_coach_all" on storage.objects;
create policy "progress_photos_coach_all" on storage.objects
  for all
  using (
    bucket_id = 'progress-photos'
    and coalesce(nullif((storage.foldername(name))[1], 'checkins'), (storage.foldername(name))[2])::uuid
        in (select id from clients where coach_id = auth.uid())
  )
  with check (
    bucket_id = 'progress-photos'
    and coalesce(nullif((storage.foldername(name))[1], 'checkins'), (storage.foldername(name))[2])::uuid
        in (select id from clients where coach_id = auth.uid())
  );

-- 3. Existing rows in client_checkins.progress_photos and the
--    progress_photos table were saved as full public URLs before this
--    change — they will no longer resolve (the app expects a bare path).
--    Since this is pre-launch, the simplest fix is to clear them and have
--    photos re-uploaded, rather than trying to parse old URLs back into
--    paths:
-- update client_checkins set progress_photos = null where progress_photos is not null;
-- delete from progress_photos;
-- (left commented out — uncomment and run if you don't need to keep any
-- existing test photos)
