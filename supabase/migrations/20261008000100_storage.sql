-- Private bucket for user files (e.g. exports). Each person can only reach
-- objects inside their own folder: user-files/<user id>/...
-- Runs only where the Supabase storage schema exists.
do $$
begin
  if exists (select from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('user-files', 'user-files', false)
      on conflict (id) do nothing;

    execute $p$
      create policy "own folder" on storage.objects for all to authenticated
        using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
        with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
    $p$;
  end if;
end;
$$;
