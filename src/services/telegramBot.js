import supabase from './supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
const BOT_URL = process.env.REACT_APP_TELEGRAM_BOT_URL;

// Telegram bot service
export const telegramBot = {
  /**
   * Send a message to a specific user via Telegram
   */
  async sendMessage(userId, message) {
    try {
      // Get user's Telegram chat ID
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('chat_id, enabled')
        .eq('user_id', userId)
        .single();

      // If no connection or notifications disabled, skip
      if (!connection || !connection.enabled) {
        return false;
      }

      // Send message via Telegram Bot API
      const response = await fetch(`${BOT_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: connection.chat_id,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        console.error('Telegram API error:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  },

  /**
   * Check if a user has connected Telegram notifications
   */
  async isConnected(userId) {
    if (!userId) return false;
    
    const { data } = await supabase
      .from('telegram_connections')
      .select('enabled')
      .eq('user_id', userId)
      .single();

    return data?.enabled || false;
  },

  /**
   * Disconnect Telegram notifications for a user
   */
  async disconnect(userId) {
    try {
      const { error } = await supabase
        .from('telegram_connections')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      return false;
    }
  },

  /**
   * Set up bot commands
   */
  async setBotCommands() {
    try {
      await fetch(`${BOT_URL}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: 'Connect your TaskPilot account' },
            { command: 'status', description: 'Check connection status' },
            { command: 'disconnect', description: 'Disconnect from TaskPilot' },
            { command: 'help', description: 'Show available commands' }
          ]
        })
      });
    } catch (error) {
      console.error('Error setting bot commands:', error);
    }
  },

  /**
   * Format a task notification message
   */
  formatTaskMessage(task) {
    return `
<b>${task.title}</b>
${task.description ? `\n${task.description}` : ''}
${task.due_date ? `\nDue: ${new Date(task.due_date).toLocaleString()}` : ''}
${task.priority ? `\nPriority: ${task.priority}` : ''}
`;
  },

  /**
   * Format a summary notification message
   */
  formatSummaryMessage(title, tasks) {
    if (!tasks.length) {
      return `<b>${title}</b>\n\nNo tasks scheduled.`;
    }

    const taskList = tasks
      .map(t => `• ${t.title}${t.due_date ? ` (${new Date(t.due_date).toLocaleDateString()})` : ''}`)
      .join('\n');

    return `<b>${title}</b>\n\n${taskList}`;
  }
};

// Initialize bot commands
telegramBot.setBotCommands().catch(console.error);
