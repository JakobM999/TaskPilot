import { handleTelegramWebhook } from '../services/telegramBotHandler';

/**
 * Telegram webhook endpoint
 * Verifies the request and passes it to the handler
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request is from Telegram
  const token = req.headers['x-telegram-bot-api-secret-token'];
  if (token !== process.env.REACT_APP_TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Handle the webhook
    await handleTelegramWebhook(req, res);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
