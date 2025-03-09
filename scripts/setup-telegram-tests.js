#!/usr/bin/env node
const { execSync } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupTests() {
  console.log('\n🚀 Setting up Telegram Integration Tests\n');

  // Generate webhook secret
  const webhookSecret = crypto.randomBytes(32).toString('hex');
  console.log('✅ Generated webhook secret');

  // Get bot token
  const botToken = await question('Enter your Telegram bot token (from BotFather): ');
  if (!botToken) {
    console.error('❌ Bot token is required');
    process.exit(1);
  }

  // Test bot token
  try {
    const result = execSync(`curl https://api.telegram.org/bot${botToken}/getMe`, { stdio: 'pipe' });
    console.log('✅ Bot token verified');
  } catch (error) {
    console.error('❌ Invalid bot token');
    process.exit(1);
  }

  // Get test chat ID
  console.log('\n👉 To get your chat ID:');
  console.log('1. Start a chat with your bot');
  console.log('2. Send /start');
  console.log('3. Visit this URL:');
  console.log(`https://api.telegram.org/bot${botToken}/getUpdates`);
  console.log('4. Find "chat":{"id": YOUR_ID} in the response\n');

  const chatId = await question('Enter your test chat ID: ');
  if (!chatId) {
    console.error('❌ Chat ID is required');
    process.exit(1);
  }

  // Test sending a message
  try {
    const testMessage = 'Testing bot configuration...';
    execSync(`curl -X POST https://api.telegram.org/bot${botToken}/sendMessage -d "chat_id=${chatId}&text=${testMessage}"`, { stdio: 'pipe' });
    console.log('✅ Successfully sent test message');
  } catch (error) {
    console.error('❌ Failed to send test message');
    process.exit(1);
  }

  // Create .env.test file
  const envContent = `
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${botToken}
TELEGRAM_WEBHOOK_SECRET=${webhookSecret}
TEST_BOT_CHAT_ID=${chatId}
TELEGRAM_BOT_URL=https://api.telegram.org/bot${botToken}

# Test Configuration
NODE_ENV=test
JEST_JUNIT_OUTPUT_DIR=reports
JEST_JUNIT_OUTPUT_NAME=telegram-test-results.xml
`;

  fs.writeFileSync(path.join(process.cwd(), '.env.test'), envContent.trim());
  console.log('✅ Created .env.test file');

  // Update package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  packageJson.scripts = {
    ...packageJson.scripts,
    'test:telegram': 'jest telegram.test.js --config jest.config.js',
    'test:telegram:integration': 'jest telegram.integration.test.js --config jest.config.js --runInBand',
    'test:telegram:all': 'jest telegram.*.test.js --config jest.config.js --runInBand'
  };

  if (!packageJson.jest) {
    packageJson.jest = {};
  }

  packageJson.jest = {
    ...packageJson.jest,
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: 'reports',
        outputName: 'telegram-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }]
    ]
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');

  // Install required packages
  console.log('\n📦 Installing required packages...');
  execSync('npm install --save-dev jest-junit', { stdio: 'inherit' });

  console.log('\n✨ Setup complete! You can now run:');
  console.log('npm run test:telegram        # Run unit tests');
  console.log('npm run test:telegram:integration  # Run integration tests');
  console.log('npm run test:telegram:all    # Run all tests\n');

  // Security reminder
  console.log('🔒 Security Reminders:');
  console.log('1. Add .env.test to .gitignore');
  console.log('2. Store credentials in CI/CD secrets');
  console.log('3. Never commit bot tokens or webhook secrets\n');

  rl.close();
}

setupTests().catch(error => {
  console.error('Error during setup:', error);
  process.exit(1);
});
