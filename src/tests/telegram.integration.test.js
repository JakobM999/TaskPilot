import { telegramBot } from '../services/telegramBot';
import { supabase } from '../services/supabaseClient';

// Only run these tests with credentials
const runIntegrationTests = process.env.TELEGRAM_BOT_TOKEN && process.env.TEST_BOT_CHAT_ID;

// Test timeout for async operations
jest.setTimeout(30000);

(runIntegrationTests ? describe : describe.skip)('Telegram Integration Tests (Live)', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user
    const { data: { user }, error } = await supabase.auth.signUp({
      email: `test_${Date.now()}@example.com`,
      password: 'test_password'
    });

    if (error) throw error;
    testUser = user;

    // Insert test connection
    await supabase
      .from('telegram_connections')
      .upsert({
        user_id: testUser.id,
        chat_id: process.env.TEST_BOT_CHAT_ID,
        enabled: true
      });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await supabase
        .from('telegram_connections')
        .delete()
        .eq('user_id', testUser.id);

      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  describe('Message Sending', () => {
    test('should send a simple text message', async () => {
      const result = await telegramBot.sendMessage(
        testUser.id,
        'Test message from integration tests'
      );
      expect(result).toBe(true);
    });

    test('should send a formatted task message', async () => {
      const task = {
        title: 'Integration Test Task',
        description: 'Testing task notifications',
        due_date: new Date().toISOString(),
        priority: 'High'
      };

      const message = telegramBot.formatTaskMessage(task);
      const result = await telegramBot.sendMessage(testUser.id, message);
      expect(result).toBe(true);
    });

    test('should send a summary message', async () => {
      const tasks = [
        { title: 'Task 1', due_date: new Date().toISOString() },
        { title: 'Task 2', due_date: new Date().toISOString() }
      ];

      const message = telegramBot.formatSummaryMessage('Integration Test Summary', tasks);
      const result = await telegramBot.sendMessage(testUser.id, message);
      expect(result).toBe(true);
    });
  });

  describe('Connection Management', () => {
    test('should check connection status', async () => {
      const isConnected = await telegramBot.isConnected(testUser.id);
      expect(isConnected).toBe(true);
    });

    test('should disconnect and reconnect', async () => {
      // Disconnect
      let result = await telegramBot.disconnect(testUser.id);
      expect(result).toBe(true);

      // Verify disconnected
      let isConnected = await telegramBot.isConnected(testUser.id);
      expect(isConnected).toBe(false);

      // Reconnect
      await supabase
        .from('telegram_connections')
        .upsert({
          user_id: testUser.id,
          chat_id: process.env.TEST_BOT_CHAT_ID,
          enabled: true
        });

      // Verify reconnected
      isConnected = await telegramBot.isConnected(testUser.id);
      expect(isConnected).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid chat ID gracefully', async () => {
      // Temporarily change chat ID
      await supabase
        .from('telegram_connections')
        .update({ chat_id: -1 })
        .eq('user_id', testUser.id);

      const result = await telegramBot.sendMessage(
        testUser.id,
        'This message should fail gracefully'
      );
      expect(result).toBe(false);

      // Restore correct chat ID
      await supabase
        .from('telegram_connections')
        .update({ chat_id: process.env.TEST_BOT_CHAT_ID })
        .eq('user_id', testUser.id);
    });

    test('should handle rate limiting', async () => {
      // Send multiple messages quickly
      const results = await Promise.all([
        telegramBot.sendMessage(testUser.id, 'Rate limit test 1'),
        telegramBot.sendMessage(testUser.id, 'Rate limit test 2'),
        telegramBot.sendMessage(testUser.id, 'Rate limit test 3'),
        telegramBot.sendMessage(testUser.id, 'Rate limit test 4'),
        telegramBot.sendMessage(testUser.id, 'Rate limit test 5')
      ]);

      // Some messages might fail due to rate limiting
      const successCount = results.filter(r => r).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Message Formatting', () => {
    test('should handle long messages', async () => {
      const longMessage = 'A'.repeat(4000); // Telegram limit is 4096 characters
      const result = await telegramBot.sendMessage(testUser.id, longMessage);
      expect(result).toBe(true);
    });

    test('should handle special characters', async () => {
      const message = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~';
      const result = await telegramBot.sendMessage(testUser.id, message);
      expect(result).toBe(true);
    });

    test('should handle multi-line messages', async () => {
      const message = `Line 1
Line 2
Line 3

Line 5 after empty line`;
      const result = await telegramBot.sendMessage(testUser.id, message);
      expect(result).toBe(true);
    });
  });
});
