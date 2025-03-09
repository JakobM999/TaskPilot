# Setting Up Telegram Notifications for TaskPilot

This guide explains how to set up and deploy the Telegram bot integration for TaskPilot notifications.

## 1. Create a Telegram Bot

1. Open Telegram and search for "@BotFather"
2. Start a chat and send `/newbot`
3. Follow the instructions to:
   - Set a name for your bot
   - Choose a username (must end in 'bot')
4. BotFather will give you an API token. Save this token.
5. Set up bot commands by sending to BotFather:
   ```
   /setcommands
   ```
   Then paste:
   ```
   start - Connect your TaskPilot account
   status - Check connection status
   disconnect - Stop receiving notifications
   help - Show available commands
   ```

## 2. Environment Configuration

Add these variables to your `.env` file:

```bash
# Telegram Bot Configuration
REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_token_here
REACT_APP_TELEGRAM_WEBHOOK_SECRET=your_random_secret_here
REACT_APP_TELEGRAM_BOT_URL=https://api.telegram.org/bot${REACT_APP_TELEGRAM_BOT_TOKEN}
```

Generate a random secret for REACT_APP_TELEGRAM_WEBHOOK_SECRET using:
```bash
openssl rand -hex 32
```

## 3. Database Setup

1. Run the database migrations:
```bash
npm run migrate
```

This will:
- Create the telegram_connections table for managing bot connections
- Add user settings for Telegram notifications
- Setup Row Level Security (RLS) policies

If you need to check the migration SQL, see:
- `supabase/migrations/20250309_add_telegram_connections.sql`
- `supabase/migrations/20250309_update_user_settings.sql`

## 4. Webhook Configuration

After deploying your application:

1. Set the webhook URL:
```bash
curl -X POST "https://api.telegram.org/bot${REACT_APP_TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-domain.com/api/telegram-webhook",
       "secret_token": "your_webhook_secret"
     }'
```

2. Verify webhook setup:
```bash
curl "https://api.telegram.org/bot${REACT_APP_TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

## 5. Testing the Integration

1. Start TaskPilot
2. Go to Settings → Notifications
3. Click "Connect Telegram"
4. Open Telegram and start a chat with your bot
5. Configure your notification preferences:
   - Daily summaries
   - Weekly summaries
   - Monthly summaries
6. Test notifications:
   - Create a task due in 5 minutes
   - You should receive both browser and Telegram notifications

## 6. Troubleshooting

### Bot Not Responding
- Check REACT_APP_TELEGRAM_BOT_TOKEN in .env
- Verify webhook URL is correct
- Check server logs for errors
- Ensure the bot is running (`/start` in Telegram)

### Connection Issues
- Verify user is logged in
- Check Supabase connection
- Inspect webhook response in logs
- Verify RLS policies are correct

### Missing Notifications
- Check if notifications are enabled in Settings
- Verify bot permissions in Telegram
- Check chat_id in telegram_connections table
- Ensure webhook is receiving events
- Verify user_settings table has correct telegram_settings

### Settings Not Saving
- Check if migrations ran successfully
- Verify user_settings table structure
- Ensure user is authenticated
- Check browser console for errors

## 7. Security Notes

- Keep your bot token secure
- Use HTTPS for webhook endpoint
- Rotate REACT_APP_TELEGRAM_WEBHOOK_SECRET periodically
- Monitor bot activity for abuse
- Use RLS policies to protect user data

## 8. Available Bot Commands

Users can interact with the bot using these commands:

- `/start` - Connect TaskPilot account
- `/status` - Check connection status
- `/disconnect` - Stop notifications
- `/help` - Show available commands

## 9. Notification Types

The bot will send notifications for:

1. Task Reminders
   - Due soon
   - Overdue tasks
   - Status changes

2. Summaries
   - Daily task overview
   - Weekly summary
   - Monthly report

3. Custom Notifications
   - User-defined alerts
   - System notifications
   - Important updates

## 10. Verifying the Setup

To verify everything is working:

1. Check database tables:
```sql
select * from telegram_connections;
select * from user_settings where telegram_settings is not null;
```

2. Test the connection:
```bash
npm run test:telegram:all
```

3. Send a test notification:
```bash
node scripts/send-telegram-test.js
```

4. Monitor webhook events:
```bash
tail -f logs/telegram-webhook.log
