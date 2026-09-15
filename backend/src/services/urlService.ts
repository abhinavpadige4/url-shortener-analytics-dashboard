import prisma from '../db';
import { connectRedis } from '../utils/redisClient';
import { generateRandomString } from '../utils/base62';
import { z } from 'zod';

// Configuration
const SHORT_CODE_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH || '7', 10);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Validation schema for URL input
const urlSchema = z.object({
  originalUrl: z.string().url('Invalid URL format')
});

/**
 * Creates a short URL from the original URL
 */
export async function createShortUrl(originalUrl: string): Promise<{
  id: number;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
}> {
  // Validate input
  const validationResult = urlSchema.safeParse({ originalUrl });
  if (!validationResult.success) {
    throw new Error(`Invalid URL: ${validationResult.error.errors[0].message}`);
  }

  // Check if URL already exists
  const existingUrl = await prisma.uRL.findFirst({
    where: { originalUrl: validationResult.data.originalUrl }
  });

  if (existingUrl) {
    return {
      id: existingUrl.id,
      originalUrl: existingUrl.originalUrl,
      shortCode: existingUrl.shortCode,
      shortUrl: `${BASE_URL}/${existingUrl.shortCode}`,
      createdAt: existingUrl.createdAt
    };
  }

  // Generate unique short code
  let shortCode: string;
  let isUnique = false;
  
  while (!isUnique) {
    shortCode = generateRandomString(SHORT_CODE_LENGTH);
    const existing = await prisma.uRL.findUnique({
      where: { shortCode }
    });
    
    isUnique = !existing;
  }

  // Create new URL entry
  const url = await prisma.uRL.create({
    data: {
      originalUrl: validationResult.data.originalUrl,
      shortCode
    }
  });

  // Cache in Redis for fast lookup
  try {
    const redis = await connectRedis();
    await redis.setEx(
      shortCode,
      3600, // 1 hour TTL
      validationResult.data.originalUrl
    );
  } catch (error) {
    console.warn('Failed to cache URL in Redis:', error);
    // Continue without caching - fallback to database
  }

  return {
    id: url.id,
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    shortUrl: `${BASE_URL}/${url.shortCode}`,
    createdAt: url.createdAt
  };
}

/**
 * Retrieves original URL by short code
 */
export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  // Try Redis cache first
  try {
    const redis = await connectRedis();
    const cachedUrl = await redis.get(shortCode);
    if (cachedUrl) {
      return cachedUrl;
    }
  } catch (error) {
    console.warn('Failed to read from Redis cache:', error);
    // Fallback to database
  }

  // Fallback to database
  const url = await prisma.uRL.findUnique({
    where: { shortCode },
    select: { originalUrl: true }
  });

  return url ? url.originalUrl : null;
}

/**
 * Gets all URLs with pagination
 */
export async function getAllUrls(page: number = 1, limit: number = 10): Promise<{
  urls: Array<{
    id: number;
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    createdAt: Date;
    clickCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;
  
  const [urls, total] = await Promise.all([
    prisma.uRL.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        createdAt: true,
        _count: {
          select: { clicks: true }
        }
      }
    }),
    prisma.uRL.count()
  ]);

  return {
    urls: urls.map(url => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${BASE_URL}/${url.shortCode}`,
      createdAt: url.createdAt,
      clickCount: url._count.clicks
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Gets statistics for a specific URL
 */
export async function getUrlStats(shortCode: string): Promise<{
  url: {
    id: number;
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    createdAt: Date;
  };
  stats: {
    totalClicks: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksThisMonth: number;
    referrers: Array<{ referrer: string | null; count: number }>;
    userAgents: Array<{ userAgent: string | null; count: number }>;
    countries: Array<{ country: string | null; count: number }>;
    devices: Array<{ device: { device: string | null; count: number }>;
    hourly: Array<{ hour: number; count: number }>;
    daily: Array<{ date: string; count: number }>;
  };
}> {
  const url = await prisma.uRL.findUnique({
    where: { shortCode },
    select: {
      id: true,
      originalUrl: true,
      shortCode: true,
      createdAt: true
    }
  });

  if (!url) {
    throw new Error('URL not found');
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total clicks
  const totalClicks = await prisma.click.count({
    where: { urlId: url.id }
  });

  // Get clicks today
  const clicksToday = await prisma.click.count({
    where: {
      urlId: url.id,
      timestamp: { gte: todayStart }
    }
  });

  // Get clicks this week
  const clicksThisWeek = await prisma.click.count({
    where: {
      urlId: url.id,
      timestamp: { gte: weekStart }
    }
  });

  // Get clicks this month
  const clicksThisMonth = await prisma.click.count({
    where: {
      urlId: url.id,
      timestamp: { gte: monthStart }
    }
  });

  // Get referrers
  const referrers = await prisma.click.groupBy({
    by: ['referrer'],
    where: { urlId: url.id },
    _count: true,
    orderBy: { _count: 'desc' },
    take: 10
  });

  // Get user agents
  const userAgents = await prisma.click.groupBy({
    by: ['userAgent'],
    where: { urlId: url.id },
    _count: true,
    orderBy: { _count: 'desc' },
    take: 10
  });

  // Get countries
  const countries = await prisma.click.groupBy({
    by: ['country'],
    where: { urlId: url.id },
    _count: true,
    orderBy: { _count: 'desc' },
    take: 10
  });

  // Get devices
  const devices = await prisma.click.groupBy({
    by: ['device'],
    where: { urlId: url.id },
    _count: true,
    orderBy: { _count: 'desc' },
    take: 10
  });

  // Get hourly stats (last 24 hours)
  const hourly = await prisma.$queryRaw<
    Array<{ hour: number; count: number }>
  >`
    SELECT 
      EXTRACT(HOUR FROM timestamp AT TIME ZONE 'UTC')::int as hour,
      COUNT(*) as count
    FROM "Click"
    WHERE "urlId" = ${url.id}
      AND timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY hour
    ORDER BY hour
  `;

  // Get daily stats (last 7 days)
  const daily = await prisma.$queryRaw<
    Array<{ date: string; count: number }>
  >`
    SELECT 
      DATE(timestamp AT TIME ZONE 'UTC') as date,
      COUNT(*) as count
    FROM "Click"
    WHERE "urlId" = ${url.id}
      AND timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY date
    ORDER BY date
  `;

  return {
    url: {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${BASE_URL}/${url.shortCode}`,
      createdAt: url.createdAt
    },
    stats: {
      totalClicks,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      referrers: referrers.map(r => ({ referrer: r.referrer, count: r._count })),
      userAgents: userAgents.map(ua => ({ userAgent: ua.userAgent, count: ua._count })),
      countries: countries.map(c => ({ country: c.country, count: c._count })),
      devices: devices.map(d => ({ device: d.device, count: d._count })),
      hourly,
      daily
    }
  };
}

export default { createShortUrl, getOriginalUrl, getAllUrls, getUrlStats };