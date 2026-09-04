-- Converts Lois Cowen's existing progress photos from the old full public
-- URL format to the bare storage path the app now expects, so they keep
-- displaying once the progress-photos bucket is switched to private.
-- Everyone else's old test photos are unaffected by this script — clear
-- those separately if you don't need to keep them.
--
-- Run in Supabase SQL Editor, AFTER progress-photos-privacy-migration.sql.

do $$
declare
  v_client_id uuid;
  v_prefix text := '/storage/v1/object/public/progress-photos/';
begin
  select c.id into v_client_id
    from clients c join profiles p on p.id = c.profile_id
    where lower(p.full_name) like '%lois%cowen%'
    limit 1;
  if v_client_id is null then raise exception 'Lois Cowen not found'; end if;

  -- client_checkins.progress_photos is a jsonb object like
  -- {"front": "<url or path>", "back": "...", ...} — rewrite each value
  -- that still looks like a full public URL down to just its path.
  update client_checkins
  set progress_photos = (
    select jsonb_object_agg(
      key,
      case
        when value #>> '{}' like '%' || v_prefix || '%'
          then to_jsonb(split_part(value #>> '{}', v_prefix, 2))
        else value
      end
    )
    from jsonb_each(progress_photos)
  )
  where client_id = v_client_id
    and progress_photos is not null
    and progress_photos::text like '%' || v_prefix || '%';

  -- The standalone photo gallery table (coach-uploaded, one photo_url per row)
  update progress_photos
  set photo_url = split_part(photo_url, v_prefix, 2)
  where client_id = v_client_id
    and photo_url like '%' || v_prefix || '%';

  raise notice 'Converted progress photo URLs to paths for client %', v_client_id;
end $$;
