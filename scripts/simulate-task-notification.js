// Script to simulate a task notification being sent to Telegram
require('dotenv').config();
const fetch = require('node-fetch');

// Get the user's chat ID from the command line or use a default
const chatId = process.argv[2] || '7891706711'; // Default to the chat ID we found earlier

// Create a sample task
const sampleTask = {
  id: 'task-' + Date.now(),
  title: 'Test Task Notification',
  description: 'This is a test task notification sent from the simulation script.',
  due_date: new Date(Date.now() + 5 * 60000).toISOString(), // Due in 5 minutes
  priority: 'High',
  status: 'In Progress',
  created_at: new Date().toISOString(),
  user_id: 'test-user-id'
};

// Function to directly send a message to Telegram
async function sendDirectMessage() {
  console.log('Sending direct message to Telegram...');
  console.log(`Using chat ID: ${chatId}`);
  
  const BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
  const BOT_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
  
  // Create a task due notification message
  const dueDate = new Date(Date.now() + 5 * 60000);
  const formattedDate = dueDate.toLocaleString();
  
  const message = `
<b>🔔 Task Due Soon</b>

Your task "<b>Test Task Notification</b>" is due in 5 minutes.

<b>Details:</b>
• Due: ${formattedDate}
• Priority: High
• Status: In Progress

<i>This is a test notification from TaskPilot.</i>
`;
  
  try {
    const response = await fetch(`${BOT_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Error sending message:', data.description);
      return false;
    }
    
    console.log('\nTask notification sent successfully!');
    console.log('Check your Telegram app for the notification.');
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Run the simulation
async function main() {
  console.log('TaskPilot Notification Simulator');
  console.log('===============================');
  
  // Send a direct message to Telegram
  await sendDirectMessage();
}

main().catch(console.error);
