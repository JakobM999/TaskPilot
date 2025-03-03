# TaskPilot Supabase Setup Guide

This guide will help you set up your local Supabase instance for TaskPilot.

## Accessing Supabase Settings

1. Open your browser and navigate to: `http://192.168.0.195:8000`
2. Log in to your local Supabase dashboard
3. In the left sidebar, look for "Settings" (often at the bottom of the sidebar)
4. Under Settings, click on "API" or "API Keys"
5. Look for the `anon` public key - this is what you'll need for your `.env` file

## Setting up Your Environment

1. Update your `.env` file with the correct anon key:

```
# TaskPilot Supabase Configuration
REACT_APP_SUPABASE_URL=http://192.168.0.195:8000
REACT_APP_SUPABASE_ANON_KEY=eyJxxxx...  # Replace with your actual anon key
```

2. Make sure you've run the SQL schema to create your database tables:
   - In the Supabase dashboard, find "SQL Editor" in the sidebar
   - Create a "New query"
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the query to create all tables and security policies

## Testing Your Connection

After setting up your environment:

1. Make sure you have installed the Supabase JS client:
```
npm install @supabase/supabase-js
```

2. Run the test connection in your browser console:
```javascript
import { testSupabaseConnection } from './services/testSupabase';
testSupabaseConnection().then(console.log);
```

3. If you see "Connected to Supabase successfully!" in your console, you're good to go!

## Common Issues

- **CORS errors**: Make sure your local Supabase server has the correct CORS settings
- **Authentication errors**: Check that your anon key is copied correctly
- **Database errors**: Ensure you've run the SQL schema file correctly
- **Connection refused**: Make sure your local Supabase server is running at the specified address

## Database Schema

The TaskPilot database includes:

- `tasks` table: Stores user tasks with due dates, priorities, etc.
- `user_settings` table: Stores user preferences
- `calendar_events` table: Stores calendar events (future implementation)

Each table has Row Level Security (RLS) enabled to ensure users can only access their own data.

## Switching Between Mock and Real Data

You can switch between using mock data or your Supabase database by editing:
`src/services/index.js`

Change the `USE_SUPABASE` value:
```javascript
// Set this to true to use Supabase, false to use mock data
const USE_SUPABASE = true;
```