-- Drop existing RLS policies for user_books table
DROP POLICY IF EXISTS "Users can view their own book records" ON public.user_books;
DROP POLICY IF EXISTS "Users can view public book records" ON public.user_books;

-- Create policy for users to view their own book records (both public and private)
CREATE POLICY "Users can view their own book records" 
ON public.user_books 
FOR SELECT 
TO authenticated 
USING ((auth.uid() = user_id));

-- Create policy for users to view other users' public book records
CREATE POLICY "Users can view public book records" 
ON public.user_books 
FOR SELECT 
TO authenticated 
USING (is_public = true);

-- Ensure other policies remain unchanged
-- Users can still only modify their own records
