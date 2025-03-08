import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './supabaseClient.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyRecurrenceMigration() {
  try {
    console.log('Starting recurrence migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'recurrence_migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL statements one by one
    console.log('Executing SQL migration...');
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      return;
    }
    
    console.log('Recurrence migration completed successfully!');
  } catch (error) {
    console.error('Failed to apply migration:', error);
  }
}

// Run the migration
applyRecurrenceMigration();