-- Fix recursive RLS and allow public student join by name + class code

-- 1) Drop recursive policy on students SELECT
DROP POLICY IF EXISTS "Students view classmates" ON public.students;

-- 2) Allow public (unauthenticated) read of students (names) to check existing entries
CREATE POLICY "Public can view students"
ON public.students
FOR SELECT
USING (true);

-- 3) Allow public (unauthenticated) inserts of students for a valid class
CREATE POLICY "Public can create student without auth"
ON public.students
FOR INSERT
WITH CHECK (
  auth.uid() IS NULL
  AND EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = class_id
  )
);

-- 4) Prevent duplicate names per class (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_students_class_name_ci
ON public.students (class_id, lower(name));