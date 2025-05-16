import { supabase } from "../integrations/supabase/client";

/**
 * This script fixes the user_books_status_check constraint that was accidentally dropped
 * Run this script with: npx ts-node src/scripts/fix-status-constraint.ts
 */
async function fixStatusConstraint() {
  console.log("Starting to fix user_books_status_check constraint...");

  try {
    // 1. First, check if we can query the user_books table
    console.log("Checking user_books table...");
    const { data: userBooks, error: userBooksError } = await supabase
      .from('user_books')
      .select('id, status')
      .limit(5);
    
    if (userBooksError) {
      console.error('Error querying user_books table:', userBooksError);
      return;
    }
    
    console.log('Successfully queried user_books table.');
    console.log('Sample status values:', userBooks?.map(book => book.status));

    // 2. Execute SQL to add the constraint back
    console.log("\nAdding the constraint back to the database...");
    const { error: sqlError } = await supabase.rpc('execute_sql', {
      sql_query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_name = 'user_books'
              AND constraint_name = 'user_books_status_check'
          ) THEN
            ALTER TABLE user_books
            ADD CONSTRAINT user_books_status_check
            CHECK (status IN ('currently-reading', 'want-to-read', 'finished'));
          END IF;
        END
        $$;
      `
    });

    if (sqlError) {
      console.error('Error executing SQL to add constraint:', sqlError);
      console.log('\nAlternative method: You need to run this SQL in the Supabase dashboard SQL editor:');
      console.log(`
        ALTER TABLE user_books
        ADD CONSTRAINT user_books_status_check
        CHECK (status IN ('currently-reading', 'want-to-read', 'finished'));
      `);
      return;
    }

    console.log('Successfully added the constraint back to the database.');

    // 3. Check for any records with invalid status values
    console.log("\nChecking for records with invalid status values...");
    const { data: invalidRecords, error: invalidError } = await supabase
      .from('user_books')
      .select('id, status')
      .not('status', 'in', '("currently-reading","want-to-read","finished")');
    
    if (invalidError) {
      console.error('Error checking for invalid records:', invalidError);
    } else if (invalidRecords && invalidRecords.length > 0) {
      console.log('Found records with invalid status values:', invalidRecords);
      
      // 4. Fix invalid records by setting them to 'currently-reading'
      console.log("\nFixing records with invalid status values...");
      for (const record of invalidRecords) {
        const { error: updateError } = await supabase
          .from('user_books')
          .update({ status: 'currently-reading' })
          .eq('id', record.id);
        
        if (updateError) {
          console.error(`Error fixing record ${record.id}:`, updateError);
        } else {
          console.log(`Fixed record ${record.id}`);
        }
      }
    } else {
      console.log('No records with invalid status values found. All records have valid status values.');
    }

    console.log("\nStatus constraint fix completed successfully!");
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
fixStatusConstraint();
