-- Allow anyone to verify if a class code exists (read-only, minimal info)
CREATE POLICY "Anyone can verify class codes"
ON public.classes
FOR SELECT
USING (true);