import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await redisClient.connect();
  }
  
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default { connectRedis, disconnectRedis };