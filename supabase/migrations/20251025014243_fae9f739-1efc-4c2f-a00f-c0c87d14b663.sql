-- Drop the existing insert policy for students
drop policy if exists "Anyone can insert students" on public.students;

-- Create a more permissive insert policy that explicitly allows unauthenticated users
create policy "Anyone can insert students"
  on public.students for insert
  to anon, authenticated
  with check (true);