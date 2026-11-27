import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  Logger.warn('REDIS_URL is missing. Please set REDIS_URL for production use.');
}

export const ioRedis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
      lazyConnect: Boolean(process.env.JEST_WORKER_ID),
    })
  : new Redis('redis://localhost:6379', { // Default fallback, but it's a real redis client
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
      lazyConnect: Boolean(process.env.JEST_WORKER_ID),
    });
