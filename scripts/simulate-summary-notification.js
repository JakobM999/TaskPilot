// Script to simulate a daily summary notification being sent to Telegram
require('dotenv').config();
const fetch = require('node-fetch');

// Get the user's chat ID from the command line or use a default
const chatId = process.argv[2] || '7891706711'; // Default to the chat ID we found earlier

// Create sample tasks
const sampleTasks = [
  {
    id: 'task-1',
    title: 'Complete TaskPilot Integration',
    due_date: new Date().toISOString(),
    status: 'In Progress'
  },
  {
    id: 'task-2',
    title: 'Review Pull Requests',
    due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Due in 2 hours
    status: 'Not Started'
  },
  {
    id: 'task-3',
    title: 'Deploy to Production',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
    status: 'Not Started'
  }
];

// Function to directly send a message to Telegram
async function sendDailySummary() {
  console.log('Sending daily summary to Telegram...');
  console.log(`Using chat ID: ${chatId}`);
  
  const BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
  const BOT_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
  
  // Create a daily summary message
  const today = new Date().toLocaleDateString();
  
  // Format tasks for the message
  const taskList = sampleTasks
    .map(task => {
      const dueDate = new Date(task.due_date).toLocaleString();
      return `• <b>${task.title}</b> - ${task.status} (Due: ${dueDate})`;
    })
    .join('\n');
  
  const message = `
<b>📋 Daily Task Summary</b>

Here's your task summary for ${today}:

${taskList}

<i>You have ${sampleTasks.length} tasks scheduled. Have a productive day!</i>
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
    
    console.log('\nDaily summary sent successfully!');
    console.log('Check your Telegram app for the notification.');
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Run the simulation
async function main() {
  console.log('TaskPilot Daily Summary Simulator');
  console.log('================================');
  
  // Send a daily summary to Telegram
  await sendDailySummary();
}

main().catch(console.error);
