#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

async function validateConfig() {
  console.log('\n🔍 Validating Telegram Integration Configuration\n');
  let hasErrors = false;

  // Check for .env.test file
  try {
    const envPath = path.join(process.cwd(), '.env.test');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env.test file not found');
      console.log('👉 Run scripts/setup-telegram-tests.js to create it');
      hasErrors = true;
      return;
    }

    const env = dotenv.parse(fs.readFileSync(envPath));
    
    // Validate required environment variables
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_WEBHOOK_SECRET',
      'TEST_BOT_CHAT_ID',
      'TELEGRAM_BOT_URL'
    ];

    for (const varName of requiredVars) {
      if (!env[varName]) {
        console.error(`❌ Missing ${varName} in .env.test`);
        hasErrors = true;
      }
    }

    // Validate bot token format
    const botToken = env.TELEGRAM_BOT_TOKEN;
    if (botToken && !/^[0-9]+:[A-Za-z0-9_-]+$/.test(botToken)) {
      console.error('❌ Invalid bot token format');
      hasErrors = true;
    }

    // Validate webhook secret length
    const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret.length < 32) {
      console.error('❌ Webhook secret should be at least 32 characters long');
      hasErrors = true;
    }

    // Test bot connectivity
    if (botToken && !hasErrors) {
      try {
        const result = JSON.parse(
          execSync(`curl -s https://api.telegram.org/bot${botToken}/getMe`, { stdio: 'pipe' }).toString()
        );

        if (!result.ok) {
          console.error('❌ Bot token is invalid or bot is not active');
          hasErrors = true;
        } else {
          console.log(`✅ Bot verified: @${result.result.username}`);
        }
      } catch (error) {
        console.error('❌ Failed to verify bot token');
        hasErrors = true;
      }
    }

    // Test webhook configuration
    if (botToken && !hasErrors) {
      try {
        const result = JSON.parse(
          execSync(`curl -s https://api.telegram.org/bot${botToken}/getWebhookInfo`, { stdio: 'pipe' }).toString()
        );

        if (result.ok && result.result.url) {
          console.log(`✅ Webhook configured: ${result.result.url}`);
        } else {
          console.warn('⚠️ Webhook not configured');
        }
      } catch (error) {
        console.error('❌ Failed to check webhook configuration');
        hasErrors = true;
      }
    }

    // Validate package.json configuration
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
      
      // Check test scripts
      const requiredScripts = [
        'test:telegram',
        'test:telegram:integration',
        'test:telegram:all'
      ];

      for (const script of requiredScripts) {
        if (!packageJson.scripts?.[script]) {
          console.error(`❌ Missing npm script: ${script}`);
          hasErrors = true;
        }
      }

      // Check Jest configuration
      if (!packageJson.jest?.reporters?.includes('jest-junit')) {
        console.warn('⚠️ jest-junit reporter not configured in package.json');
      }
    } catch (error) {
      console.error('❌ Failed to validate package.json');
      hasErrors = true;
    }

    // Check for required test files
    const requiredFiles = [
      'src/tests/telegram.test.js',
      'src/tests/telegram.integration.test.js',
      'src/services/telegramBot.js',
      'src/services/telegramBotHandler.js',
      'src/api/telegram-webhook.js'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(process.cwd(), file))) {
        console.error(`❌ Missing required file: ${file}`);
        hasErrors = true;
      }
    }

    // Check test reports directory
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      console.log('⚠️ Reports directory not found, will be created during test run');
    }

    // Check if .env.test is in .gitignore
    try {
      const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
      if (!gitignore.includes('.env.test')) {
        console.warn('⚠️ .env.test is not listed in .gitignore');
      }
    } catch (error) {
      console.warn('⚠️ Could not verify .gitignore configuration');
    }

    if (!hasErrors) {
      console.log('\n✨ All validations passed! Your Telegram integration is properly configured.\n');
    } else {
      console.log('\n❌ Found configuration issues. Please fix them before running tests.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

// Run validation
console.log('Running configuration validation...');
validateConfig().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
