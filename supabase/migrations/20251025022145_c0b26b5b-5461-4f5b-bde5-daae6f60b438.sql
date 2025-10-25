-- Drop problematic policies
DROP POLICY IF EXISTS "Teachers view own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students view enrolled class" ON public.classes;

-- Create security definer function to check if user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = _class_id
    AND teacher_id = auth.uid()
  );
$$;

-- Create security definer function to check if user is student in class
CREATE OR REPLACE FUNCTION public.is_student_in_class(_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students
    WHERE class_id = _class_id
    AND auth_user_id = auth.uid()
  );
$$;

-- Recreate classes policies using security definer functions
CREATE POLICY "Teachers can select their own classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert their own classes"
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own classes"
  ON public.classes
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own classes"
  ON public.classes
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their enrolled class"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (public.is_student_in_class(id));