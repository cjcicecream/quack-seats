-- Allow anyone to view classes by class code (needed for student login)
create policy "Anyone can view classes by code"
  on public.classes for select
  using (true);