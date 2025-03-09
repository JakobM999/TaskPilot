const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_KEY
);

async function runMigrations() {
  try {
    console.log('Running migrations...');

    // Read migration files
    const fs = require('fs');
    const path = require('path');

    // First add telegram connections table
    const telegramConnectionsMigration = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250309_add_telegram_connections.sql'),
      'utf8'
    );

    // Then update user_settings table
    const userSettingsMigration = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250309_update_user_settings.sql'),
      'utf8'
    );

    // Execute migrations
    console.log('Creating telegram_connections table...');
    const { error: error1 } = await supabase.from('telegram_connections').select('count').limit(1);
    if (error1?.code === '42P01') { // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec', { sql: telegramConnectionsMigration });
      if (createError) throw createError;
      console.log('Created telegram_connections table');
    } else {
      console.log('telegram_connections table already exists');
    }

    console.log('Updating user_settings table...');
    const { error: updateError } = await supabase.rpc('exec', { sql: userSettingsMigration });
    if (updateError) throw updateError;
    console.log('Updated user_settings table');

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
