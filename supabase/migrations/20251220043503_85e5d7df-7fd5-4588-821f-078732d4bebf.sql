-- Add preference priority setting to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS prioritize_teacher_preferences boolean DEFAULT false;