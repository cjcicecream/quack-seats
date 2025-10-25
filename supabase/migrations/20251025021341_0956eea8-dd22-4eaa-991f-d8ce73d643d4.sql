-- Add auth_user_id to students table for proper authentication
ALTER TABLE public.students ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_students_auth_user_id ON public.students(auth_user_id);

-- Drop overly permissive policies on classes table
DROP POLICY IF EXISTS "Anyone can view classes by code" ON public.classes;

-- Drop overly permissive policies on students table
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
DROP POLICY IF EXISTS "Anyone can insert students" ON public.students;
DROP POLICY IF EXISTS "Students are viewable by their class teacher" ON public.students;

-- Drop overly permissive policies on student_preferences table
DROP POLICY IF EXISTS "Anyone can view preferences" ON public.student_preferences;
DROP POLICY IF EXISTS "Anyone can insert preferences" ON public.student_preferences;

-- Create restrictive policy for classes: Teachers can view their own classes
CREATE POLICY "Teachers view own classes" 
ON public.classes 
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Create policy for students to view their enrolled class
CREATE POLICY "Students view enrolled class" 
ON public.classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.class_id = classes.id 
    AND students.auth_user_id = auth.uid()
  )
);

-- Create policy for teachers to view students in their classes
CREATE POLICY "Teachers view own class students" 
ON public.students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = students.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- Create policy for students to view classmates
CREATE POLICY "Students view classmates" 
ON public.students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students self 
    WHERE self.class_id = students.class_id 
    AND self.auth_user_id = auth.uid()
  )
);

-- Create policy for authenticated students to create their own profile
CREATE POLICY "Students create own profile" 
ON public.students 
FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

-- Create policy for teachers to add students to their classes
CREATE POLICY "Teachers add students to own classes" 
ON public.students 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = students.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- Create policy for students to manage their own preferences
CREATE POLICY "Students manage own preferences" 
ON public.student_preferences 
FOR ALL 
USING (
  auth.uid() = (
    SELECT auth_user_id FROM students WHERE id = student_id
  )
)
WITH CHECK (
  auth.uid() = (
    SELECT auth_user_id FROM students WHERE id = student_id
  )
);

-- Create policy for students to view seating arrangements for their class
CREATE POLICY "Students view own class seating" 
ON public.seating_arrangements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.class_id = seating_arrangements.class_id 
    AND students.auth_user_id = auth.uid()
  )
);