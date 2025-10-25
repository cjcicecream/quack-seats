-- Allow teachers to delete preferences in their classes
CREATE POLICY "Teachers can delete preferences in their classes" 
ON public.student_preferences 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = student_preferences.class_id 
    AND classes.teacher_id = auth.uid()
  )
);