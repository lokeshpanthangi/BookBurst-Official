import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or API key not found in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('Checking user_books table status...');
    
    // 1. Check if we can query the user_books table
    const { data: userBooks, error: userBooksError } = await supabase
      .from('user_books')
      .select('id, status')
      .limit(5);
    
    if (userBooksError) {
      console.error('Error querying user_books table:', userBooksError);
      return;
    }
    
    console.log('Successfully queried user_books table.');
    console.log('Sample status values:', userBooks.map(book => book.status));
    
    // 2. Test inserting a record with an invalid status to check if constraint is working
    console.log('\nTesting constraint by attempting to insert invalid status...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_books')
      .insert({
        book_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
        status: 'invalid-status' // This should fail if constraint is working
      })
      .select();
    
    if (insertError) {
      console.log('Good! Insert with invalid status was rejected:', insertError.message);
      console.log('This indicates the constraint is working properly.');
    } else {
      console.log('Warning: Insert with invalid status was accepted. Constraint is NOT working.');
      console.log('Inserted data:', insertData);
      
      // Clean up the test record
      if (insertData && insertData[0]?.id) {
        await supabase
          .from('user_books')
          .delete()
          .eq('id', insertData[0].id);
        console.log('Deleted test record.');
      }
    }
    
    // 3. Check if any records have invalid status values
    console.log('\nChecking for records with invalid status values...');
    const { data: invalidRecords, error: invalidError } = await supabase
      .from('user_books')
      .select('id, status')
      .not('status', 'in', '("currently-reading","want-to-read","finished")');
    
    if (invalidError) {
      console.error('Error checking for invalid records:', invalidError);
    } else if (invalidRecords && invalidRecords.length > 0) {
      console.log('Found records with invalid status values:', invalidRecords);
      console.log('These records should be fixed.');
    } else {
      console.log('No records with invalid status values found. All records have valid status values.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
