-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to handle conflicts gracefully
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.teachers (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Teacher'))
  ON CONFLICT (id) DO NOTHING;
  return new;
end;
$$;

-- Create the trigger to automatically create teacher profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_teacher();