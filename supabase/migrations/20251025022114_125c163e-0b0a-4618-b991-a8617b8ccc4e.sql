-- Ensure trigger exists for teacher profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_teacher ON auth.users;

CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_teacher();

-- Update RLS policy to be more explicit
DROP POLICY IF EXISTS "Teachers view own classes" ON public.classes;

CREATE POLICY "Teachers view own classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);