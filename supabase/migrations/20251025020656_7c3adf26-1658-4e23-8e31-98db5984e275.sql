-- Enable RLS on table_layouts and add policies for teachers
ALTER TABLE public.table_layouts ENABLE ROW LEVEL SECURITY;

-- Teachers can view their class layouts
CREATE POLICY "Teachers can view their class layouts" 
ON public.table_layouts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = table_layouts.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- Teachers can insert layouts for their classes
CREATE POLICY "Teachers can insert layouts for their classes" 
ON public.table_layouts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = table_layouts.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- Teachers can update layouts for their classes
CREATE POLICY "Teachers can update layouts for their classes" 
ON public.table_layouts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = table_layouts.class_id 
    AND classes.teacher_id = auth.uid()
  )
);

-- Teachers can delete layouts for their classes
CREATE POLICY "Teachers can delete layouts for their classes" 
ON public.table_layouts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = table_layouts.class_id 
    AND classes.teacher_id = auth.uid()
  )
);