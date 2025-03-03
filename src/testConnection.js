// Simple script to test Supabase connection
import { testSupabaseConnection } from './services/testSupabase';

// Run test and display results
console.log('Testing connection to Supabase...');
testSupabaseConnection()
  .then(result => {
    console.log('======= TEST RESULTS =======');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    if (!result.success && result.error) {
      console.error('Error details:', result.error);
    }
    console.log('===========================');
  })
  .catch(error => {
    console.error('Error running test:', error);
  });

// This file can be run with "node testConnection.js" from the project root