-- Fix RLS policy for table_layouts to allow teachers to insert new layouts
drop policy if exists "Teachers can manage their class layouts" on public.table_layouts;

-- Separate policies for different operations
create policy "Teachers can view their class layouts"
  on public.table_layouts for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = table_layouts.class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can insert layouts for their classes"
  on public.table_layouts for insert
  with check (
    exists (
      select 1 from public.classes
      where classes.id = class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update their class layouts"
  on public.table_layouts for update
  using (
    exists (
      select 1 from public.classes
      where classes.id = table_layouts.class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete their class layouts"
  on public.table_layouts for delete
  using (
    exists (
      select 1 from public.classes
      where classes.id = table_layouts.class_id
      and classes.teacher_id = auth.uid()
    )
  );