import supabase from './supabaseClient';

const handleStart = async (chatId, userId) => {
  try {
    // Check if userId is provided
    if (!userId) {
      return `Welcome to TaskPilot Bot!\n\nTo connect your TaskPilot account, please use the "Connect Telegram" button in the TaskPilot app settings.\n\nIf you've already clicked that button but still see this message, please try again or contact support.`;
    }

    // Store the connection in Supabase
    const { error } = await supabase
      .from('telegram_connections')
      .upsert({
        user_id: userId,
        chat_id: chatId,
        enabled: true
      });

    if (error) throw error;

    return `✅ Successfully connected to TaskPilot!\n\nYou will now receive notifications here for:\n- Task reminders\n- Daily summaries\n- Weekly summaries\n- Monthly summaries\n\nUse /help to see available commands.`;
  } catch (error) {
    console.error('Error connecting Telegram:', error);
    return '❌ Error connecting to TaskPilot. Please try again or contact support.';
  }
};

const handleStatus = async (chatId) => {
  try {
    const { data } = await supabase
      .from('telegram_connections')
      .select('enabled, connected_at')
      .eq('chat_id', chatId)
      .single();

    if (!data) {
      return '❌ Not connected to TaskPilot. Use /start to connect.';
    }

    const connectedDate = new Date(data.connected_at).toLocaleString();
    const status = data.enabled ? '✅ Active' : '⏸️ Paused';

    return `TaskPilot Connection Status:\n\nStatus: ${status}\nConnected since: ${connectedDate}`;
  } catch (error) {
    console.error('Error checking status:', error);
    return '❌ Error checking connection status. Please try again.';
  }
};

const handleDisconnect = async (chatId) => {
  try {
    const { error } = await supabase
      .from('telegram_connections')
      .delete()
      .eq('chat_id', chatId);

    if (error) throw error;

    return '👋 Successfully disconnected from TaskPilot. You will no longer receive notifications here.';
  } catch (error) {
    console.error('Error disconnecting:', error);
    return '❌ Error disconnecting from TaskPilot. Please try again.';
  }
};

const handleHelp = () => {
  return `TaskPilot Bot Commands:

/start - Connect your TaskPilot account
/status - Check connection status
/disconnect - Stop receiving notifications
/help - Show this help message

You can also access these features in TaskPilot's Settings → Notifications`;
};

/**
 * Main webhook handler for Telegram bot
 */
export const handleTelegramWebhook = async (req, res) => {
  const { message } = req.body;
  
  if (!message || !message.chat || !message.text) {
    return res.status(400).send('Invalid request');
  }

  const chatId = message.chat.id;
  const command = message.text.split(' ')[0];
  const args = message.text.split(' ').slice(1);

  let response;
  switch (command) {
    case '/start':
      response = await handleStart(chatId, args[0]);
      break;
    case '/status':
      response = await handleStatus(chatId);
      break;
    case '/disconnect':
      response = await handleDisconnect(chatId);
      break;
    case '/help':
      response = handleHelp();
      break;
    default:
      response = 'Unknown command. Use /help to see available commands.';
  }

  // Send response back to user
  await fetch(`${process.env.REACT_APP_TELEGRAM_BOT_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: response,
      parse_mode: 'HTML'
    })
  });

  res.status(200).send('OK');
};
