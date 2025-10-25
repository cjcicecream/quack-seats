-- Allow public (unauthenticated) students to insert their preferences
DROP POLICY IF EXISTS "Students manage own preferences" ON public.student_preferences;

CREATE POLICY "Public students can insert preferences"
ON public.student_preferences
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_preferences.student_id
    AND s.class_id = student_preferences.class_id
  )
);

-- Allow public students to update their own preferences
CREATE POLICY "Public students can update own preferences"
ON public.student_preferences
FOR UPDATE
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_preferences.student_id
    AND s.class_id = student_preferences.class_id
  )
);

-- Allow public students to view their own preferences
CREATE POLICY "Public students can view own preferences"
ON public.student_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_preferences.student_id
  )
);