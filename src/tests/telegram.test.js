import { telegramBot } from '../services/telegramBot';
import { handleTelegramWebhook } from '../services/telegramBotHandler';
import webhookHandler from '../api/telegram-webhook';

// Mock the Supabase client
jest.mock('../services/supabaseClient', () => {
  return {
    __esModule: true,
    default: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { chat_id: '123456', enabled: true }
      }),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
      }
    }
  };
});

describe('Telegram Integration Tests', () => {
  // Mock environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      REACT_APP_TELEGRAM_BOT_TOKEN: 'test_token',
      REACT_APP_TELEGRAM_WEBHOOK_SECRET: 'test_secret',
      REACT_APP_TELEGRAM_BOT_URL: 'https://api.telegram.org/bottest_token'
    };
    
    // Mock fetch
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: true })
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('telegramBot', () => {
    test('sendMessage should send message to connected user', async () => {
      const userId = 'test-user-id';
      const message = 'Test message';

      // Mock Supabase response
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { chat_id: '123456', enabled: true }
        })
      };

      const result = await telegramBot.sendMessage(userId, message);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(message)
        })
      );
    });

    test('isConnected should check user connection status', async () => {
      const userId = 'test-user-id';
      const result = await telegramBot.isConnected(userId);
      expect(result).toBe(true);
    });

    test('disconnect should remove user connection', async () => {
      const userId = 'test-user-id';
      const result = await telegramBot.disconnect(userId);
      expect(result).toBe(true);
    });

    test('formatTaskMessage should format task correctly', () => {
      const task = {
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-03-09T10:00:00Z',
        priority: 'High'
      };

      const message = telegramBot.formatTaskMessage(task);
      expect(message).toContain('Test Task');
      expect(message).toContain('Test Description');
      expect(message).toContain('High');
    });

    test('formatSummaryMessage should handle empty tasks', () => {
      const message = telegramBot.formatSummaryMessage('Daily Summary', []);
      expect(message).toContain('No tasks scheduled');
    });

    test('formatSummaryMessage should format task list', () => {
      const tasks = [
        { title: 'Task 1', due_date: '2025-03-09' },
        { title: 'Task 2', due_date: '2025-03-10' }
      ];

      const message = telegramBot.formatSummaryMessage('Daily Summary', tasks);
      expect(message).toContain('Task 1');
      expect(message).toContain('Task 2');
    });
  });

  describe('webhook handler', () => {
    test('should handle start command', async () => {
      const req = {
        method: 'POST',
        headers: {
          'x-telegram-bot-api-secret-token': 'test_secret'
        },
        body: {
          message: {
            chat: { id: 123456 },
            text: '/start user-123'
          }
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn()
      };

      await handleTelegramWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(fetch).toHaveBeenCalled();
    });

    test('should handle status command', async () => {
      const req = {
        method: 'POST',
        headers: {
          'x-telegram-bot-api-secret-token': 'test_secret'
        },
        body: {
          message: {
            chat: { id: 123456 },
            text: '/status'
          }
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn()
      };

      await handleTelegramWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(fetch).toHaveBeenCalled();
    });

    test('should handle invalid requests', async () => {
      const req = {
        method: 'POST',
        headers: {
          'x-telegram-bot-api-secret-token': 'test_secret'
        },
        body: {}
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn()
      };

      await handleTelegramWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should verify webhook secret', async () => {
      const req = {
        method: 'POST',
        headers: {
          'x-telegram-bot-api-secret-token': 'wrong_secret'
        },
        body: {
          message: {
            chat: { id: 123456 },
            text: '/start'
          }
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn()
      };

      await webhookHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
