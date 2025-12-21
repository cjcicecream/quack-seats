-- Fix security issues by removing dangerous public policies

-- 1. Drop the vulnerable "Public can view students" policy that exposes all student data
DROP POLICY IF EXISTS "Public can view students" ON public.students;

-- 2. Drop the vulnerable "Public students can update own preferences" policy with USING (true)
DROP POLICY IF EXISTS "Public students can update own preferences" ON public.student_preferences;

-- 3. Drop public insert policies since edge function handles this now
DROP POLICY IF EXISTS "Public can create student without auth" ON public.students;
DROP POLICY IF EXISTS "Public students can insert preferences" ON public.student_preferences;

-- 4. Drop public SELECT on student_preferences since edge function handles this now
DROP POLICY IF EXISTS "Public students can view own preferences" ON public.student_preferences;

-- 5. Remove the overly permissive "Anyone can verify class codes" policy
DROP POLICY IF EXISTS "Anyone can verify class codes" ON public.classes;