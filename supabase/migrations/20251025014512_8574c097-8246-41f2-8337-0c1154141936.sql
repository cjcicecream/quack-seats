-- Allow public read of students to support join-by-name flow (case-insensitive lookup)
create policy "Anyone can view students"
  on public.students for select
  using (true);