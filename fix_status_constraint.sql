-- First, drop the constraint if it exists (to ensure clean state)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'user_books'
      AND constraint_name = 'user_books_status_check'
  ) THEN
    ALTER TABLE user_books
    DROP CONSTRAINT user_books_status_check;
  END IF;
END
$$;

-- Add the constraint
ALTER TABLE user_books
ADD CONSTRAINT user_books_status_check
CHECK (status IN ('currently-reading', 'want-to-read', 'finished'));

-- Check for any records with invalid status values
SELECT id, status
FROM user_books
WHERE status NOT IN ('currently-reading', 'want-to-read', 'finished');

-- Fix any records with invalid status values (if needed)
-- UPDATE user_books
-- SET status = 'currently-reading'
-- WHERE status NOT IN ('currently-reading', 'want-to-read', 'finished');
