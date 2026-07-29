-- Create bucket
insert into storage.buckets (id, name, public) 
values ('public-assets', 'public-assets', true) 
on conflict (id) do nothing;

-- Policies
create policy "Public Access" on storage.objects for select using ( bucket_id = 'public-assets' );
create policy "Auth Insert" on storage.objects for insert with check ( bucket_id = 'public-assets' and auth.role() = 'authenticated' );
create policy "Auth Update" on storage.objects for update using ( bucket_id = 'public-assets' and auth.role() = 'authenticated' );
create policy "Auth Delete" on storage.objects for delete using ( bucket_id = 'public-assets' and auth.role() = 'authenticated' );
