#!/usr/bin/env node

/**
 * Example: Using PostPilot CLI from an AI Agent (Node.js)
 *
 * This demonstrates how AI agents can programmatically use the PostPilot CLI
 * to schedule social media posts.
 */

const { spawnSync } = require('child_process');

// Configuration
const POSTPILOT_API_KEY = process.env.POSTPILOT_API_KEY;

if (!POSTPILOT_API_KEY) {
  console.error('❌ POSTPILOT_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Execute a PostPilot CLI command
 * @param {string[]} args Array of command arguments
 */
function runPostPilotCommand(args) {
  if (!Array.isArray(args)) {
    throw new TypeError('Command arguments must be an array to prevent command injection');
  }

  const result = spawnSync('postpilot', args, {
    env: { ...process.env, POSTPILOT_API_KEY },
    encoding: 'utf-8',
  });

  if (result.error) {
    console.error(`Command failed: postpilot ${args.join(' ')}`);
    console.error(result.error.message);
    throw result.error;
  }

  if (result.status !== 0) {
    const errorMsg = `Command exited with status ${result.status}`;
    console.error(`Command failed: postpilot ${args.join(' ')}`);
    console.error(errorMsg);
    if (result.stderr) console.error(result.stderr);
    throw new Error(errorMsg);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    console.error('Failed to parse command output as JSON');
    if (result.stdout) console.error('Output:', result.stdout);
    throw error;
  }
}

/**
 * Main AI Agent workflow
 */
async function main() {
  console.log('🤖 AI Agent: Starting social media scheduling workflow...\n');

  try {
    // Step 1: Get available integrations
    console.log('📋 Fetching connected integrations...');
    const integrations = runPostPilotCommand(['integrations:list']);
    console.log(`Found ${integrations.length || 0} integrations\n`);

    // Step 2: Create multiple scheduled posts
    const posts = [
      {
        content: '🌅 Good morning! Starting the day with positive energy.',
        schedule: getScheduledTime(9, 0), // 9 AM
      },
      {
        content: '☕ Midday motivation: Keep pushing towards your goals!',
        schedule: getScheduledTime(12, 0), // 12 PM
      },
      {
        content: '🌙 Evening reflection: What did you accomplish today?',
        schedule: getScheduledTime(20, 0), // 8 PM
      },
    ];

    console.log('📝 Creating scheduled posts...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`  ${i + 1}. Creating post scheduled for ${post.schedule}...`);

      const args = ['posts:create', '-c', post.content, '-s', post.schedule];
      const result = runPostPilotCommand(args);

      console.log(`  ✅ Post created with ID: ${result.id || 'unknown'}`);
    }

    console.log('\n📊 Checking created posts...');
    const postsList = runPostPilotCommand(['posts:list', '-l', '5']);
    console.log(`Total recent posts: ${postsList.total || 0}\n`);

    console.log('✅ AI Agent workflow completed successfully!');
  } catch (error) {
    console.error('\n❌ AI Agent workflow failed:', error.message);
    process.exit(1);
  }
}

/**
 * Helper: Get ISO 8601 timestamp for today at specific time
 */
function getScheduledTime(hours, minutes) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (date < new Date()) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString();
}

// Run the agent
main().catch(console.error);
