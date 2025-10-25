-- Create teachers table
create table public.teachers (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  created_at timestamptz default now()
);

alter table public.teachers enable row level security;

create policy "Teachers can view own profile"
  on public.teachers for select
  using (auth.uid() = id);

create policy "Teachers can update own profile"
  on public.teachers for update
  using (auth.uid() = id);

create policy "Teachers can insert own profile"
  on public.teachers for insert
  with check (auth.uid() = id);

-- Create classes table
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.teachers(id) on delete cascade not null,
  name text not null,
  class_code text unique not null,
  max_preferences int default 3,
  created_at timestamptz default now()
);

alter table public.classes enable row level security;

create policy "Teachers can manage their own classes"
  on public.classes for all
  using (auth.uid() = teacher_id);

-- Create students table
create table public.students (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  unique(class_id, name)
);

alter table public.students enable row level security;

create policy "Students are viewable by their class teacher"
  on public.students for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Anyone can insert students"
  on public.students for insert
  with check (true);

-- Create table layouts
create table public.table_layouts (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  layout jsonb not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.table_layouts enable row level security;

create policy "Teachers can manage their class layouts"
  on public.table_layouts for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = table_layouts.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Create student preferences table
create table public.student_preferences (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  preferences jsonb not null,
  additional_comments text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.student_preferences enable row level security;

create policy "Anyone can view preferences"
  on public.student_preferences for select
  using (true);

create policy "Anyone can insert preferences"
  on public.student_preferences for insert
  with check (true);

create policy "Teachers can update preferences in their classes"
  on public.student_preferences for update
  using (
    exists (
      select 1 from public.classes
      where classes.id = student_preferences.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Create seating arrangements table
create table public.seating_arrangements (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  arrangement jsonb not null,
  created_at timestamptz default now()
);

alter table public.seating_arrangements enable row level security;

create policy "Teachers can manage their class arrangements"
  on public.seating_arrangements for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = seating_arrangements.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Function to handle new teacher signup
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.teachers (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Teacher'));
  return new;
end;
$$;

create trigger on_auth_teacher_created
  after insert on auth.users
  for each row execute procedure public.handle_new_teacher();