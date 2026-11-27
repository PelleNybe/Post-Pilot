import { PostPilotConfig } from './api';

export function getConfig(): PostPilotConfig {
  const apiKey = process.env.POSTPILOT_API_KEY;
  const apiUrl = process.env.POSTPILOT_API_URL;

  if (!apiKey) {
    console.error('❌ Error: POSTPILOT_API_KEY environment variable is required');
    console.error('Please set it using: export POSTPILOT_API_KEY=your_api_key');
    process.exit(1);
  }

  return {
    apiKey,
    apiUrl,
  };
}
