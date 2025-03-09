// Script to set up the Telegram webhook
require('dotenv').config();
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.REACT_APP_TELEGRAM_WEBHOOK_SECRET;
const BOT_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function getBotInfo() {
  try {
    const response = await fetch(`${BOT_URL}/getMe`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error getting bot info:', data.description);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching bot info:', error);
    return null;
  }
}

async function setWebhook(url) {
  try {
    console.log(`Setting webhook to: ${url}`);
    
    const response = await fetch(`${BOT_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        secret_token: WEBHOOK_SECRET
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error setting webhook:', data.description);
      return false;
    }
    
    console.log('Webhook set successfully!');
    return true;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}

async function getWebhookInfo() {
  try {
    const response = await fetch(`${BOT_URL}/getWebhookInfo`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error getting webhook info:', data.description);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching webhook info:', error);
    return null;
  }
}

async function deleteWebhook() {
  try {
    console.log('Deleting webhook...');
    const response = await fetch(`${BOT_URL}/deleteWebhook`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error deleting webhook:', data.description);
      return false;
    }
    
    console.log('Webhook deleted successfully.');
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return false;
  }
}

async function main() {
  console.log('Getting bot information...');
  const botInfo = await getBotInfo();
  
  if (!botInfo) {
    console.error('Failed to get bot information. Check your bot token.');
    return;
  }
  
  console.log(`Bot Information:`);
  console.log(`- Name: ${botInfo.first_name}`);
  console.log(`- Username: @${botInfo.username}`);
  console.log(`- ID: ${botInfo.id}`);
  
  console.log('\nGetting current webhook info...');
  const webhookInfo = await getWebhookInfo();
  
  if (webhookInfo) {
    console.log('Current webhook configuration:');
    console.log(`- URL: ${webhookInfo.url || 'Not set'}`);
    console.log(`- Has custom certificate: ${webhookInfo.has_custom_certificate}`);
    console.log(`- Pending update count: ${webhookInfo.pending_update_count}`);
    console.log(`- Last error date: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toLocaleString() : 'None'}`);
    console.log(`- Last error message: ${webhookInfo.last_error_message || 'None'}`);
    console.log(`- Max connections: ${webhookInfo.max_connections}`);
    console.log(`- Allowed updates: ${webhookInfo.allowed_updates ? webhookInfo.allowed_updates.join(', ') : 'All'}`);
  }
  
  // Ask what action to take
  console.log('\nWhat would you like to do?');
  console.log('1. Delete webhook (for testing with getUpdates)');
  console.log('2. Set webhook to production URL');
  console.log('3. Set webhook to localhost (for development)');
  
  // For now, let's just delete the webhook for testing
  console.log('\nDeleting webhook for testing...');
  await deleteWebhook();
  
  console.log('\nWebhook has been deleted. You can now:');
  console.log('1. Test the bot by sending messages to it');
  console.log('2. Use the send-telegram-test.js script to send test notifications');
  console.log('3. Run this script again to set up the webhook when you\'re done testing');
  
  console.log('\nTo set up the webhook for production, run:');
  console.log(`node scripts/setup-telegram-webhook.js production https://your-domain.com/api/telegram-webhook`);
  
  console.log('\nTo set up the webhook for local development, run:');
  console.log(`node scripts/setup-telegram-webhook.js local http://localhost:3000/api/telegram-webhook`);
}

// Check if we have command line arguments
if (process.argv.length > 3) {
  const mode = process.argv[2];
  const url = process.argv[3];
  
  if (mode === 'production' || mode === 'local') {
    console.log(`Setting up webhook in ${mode} mode...`);
    setWebhook(url)
      .then((success) => {
        if (success) {
          console.log(`\nWebhook has been set to: ${url}`);
          console.log('You can now use the bot with the webhook.');
        } else {
          console.log('\nThere was an error setting the webhook.');
          console.log('This is expected if you\'re using a test domain that doesn\'t exist.');
          console.log('When you deploy your application, use your actual domain:');
          console.log(`node scripts/setup-telegram-webhook.js production https://your-real-domain.com/api/telegram-webhook`);
        }
      })
      .catch(console.error);
  } else {
    console.error('Invalid mode. Use "production" or "local".');
    main().catch(console.error);
  }
} else {
  main().catch(console.error);
}
