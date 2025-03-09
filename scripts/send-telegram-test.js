// Script to send a test notification to the Telegram bot
require('dotenv').config();
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
const BOT_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function getUpdates() {
  try {
    const response = await fetch(`${BOT_URL}/getUpdates`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error getting updates:', data.description);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching updates:', error);
    return null;
  }
}

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

async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`${BOT_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error sending message:', data.description);
      return false;
    }
    
    console.log('Message sent successfully!');
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
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
  
  console.log('\nChecking for recent updates (messages sent to the bot)...');
  const updates = await getUpdates();
  
  let chatId = null;
  let userName = null;
  
  if (!updates || updates.length === 0) {
    console.log('No recent updates found.');
    console.log(`Please send a message to your bot @${botInfo.username}`);
    console.log('Then run this script again to get the chat ID.');
    return;
  } else {
    // Find the most recent chat ID from updates
    for (const update of updates) {
      if (update.message && update.message.chat && update.message.chat.id) {
        chatId = update.message.chat.id;
        userName = update.message.chat.username || update.message.chat.first_name;
        break;
      }
    }
    
    if (!chatId) {
      console.log('No chat ID found in recent updates. Please send a message to your bot @' + botInfo.username);
      console.log('Then run this script again to get the chat ID.');
      return;
    }
    
    console.log(`Found chat ID: ${chatId} (${userName})`);
  }
  
  console.log('\nSending test notification...');
  const testMessage = `
<b>🎉 TaskPilot Test Notification</b>

This is a test notification from TaskPilot.
The Telegram integration is working correctly!

<b>Bot Information:</b>
- Name: ${botInfo.first_name}
- Username: @${botInfo.username}

<b>Your Information:</b>
- Chat ID: ${chatId}
- Name: ${userName || 'Unknown'}

<i>You can use this chat to receive notifications about your tasks, reminders, and summaries.</i>
`;
  
  const success = await sendMessage(chatId, testMessage);
  
  if (success) {
    console.log('\nTest notification sent successfully!');
    console.log(`Chat ID: ${chatId}`);
    console.log('You can now use this chat ID to receive notifications from TaskPilot.');
  } else {
    console.error('\nFailed to send test notification.');
  }
}

main().catch(console.error);
