-- Allow teachers to view student preferences for their classes
CREATE POLICY "Teachers can view preferences in their classes"
ON public.student_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = student_preferences.class_id
    AND classes.teacher_id = auth.uid()
  )
);