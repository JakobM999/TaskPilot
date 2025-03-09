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

1. Run the migration script:
```sql
-- Create telegram_connections table
create table telegram_connections (
    user_id uuid references auth.users(id) primary key,
    chat_id bigint not null,
    connected_at timestamp with time zone default now(),
    enabled boolean default true
);

-- Add RLS policies
alter table telegram_connections enable row level security;

create policy "Users can view their own telegram connection"
    on telegram_connections for select
    using (auth.uid() = user_id);

create policy "Users can manage their own telegram connection"
    on telegram_connections for all
    using (auth.uid() = user_id);
```

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
5. Test notifications:
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
