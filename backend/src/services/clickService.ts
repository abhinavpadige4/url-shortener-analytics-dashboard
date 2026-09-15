import prisma from '../db';
import { z } from 'zod';

/**
 * Logs a click event for analytics
 */
export async function logClick(urlId: number, request: Request): Promise<void> {
  // Extract analytics data from request
  const referrer = request.headers.get('referer') || null;
  const userAgent = request.headers.get('user-agent') || null;
  
  // In a real app, you might use a geo-ip service for country/device detection
  // For now, we'll leave these as null or use simple detection
  const country = null; // Would come from geo-ip service
  const device = detectDevice(userAgent || '');

  // Create click record
  await prisma.click.create({
    data: {
      urlId,
      referrer,
      userAgent,
      country,
      device
    }
  });
}

/**
 * Simple device detection based on user agent
 */
function detectDevice(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    return 'mobile';
  }
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  return 'desktop';
}

/**
 * Gets click analytics for a URL over a time period
 */
export async function getClickAnalytics(
  urlId: number, 
  startDate: Date, 
  endDate: Date = new Date()
): Promise<Array<{ date: string; count: number }>> {
  const clicks = await prisma.click.groupBy({
    by: ['timestamp'],
    where: {
      urlId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true,
    orderBy: { timestamp: 'asc' }
  });

  return clicks.map(click => ({
    date: new Click(click.timestamp).toISOString().split('T')[0],
    count: click._count
  }));
}

export default { logClick, detectDevice, getClickAnalytics };