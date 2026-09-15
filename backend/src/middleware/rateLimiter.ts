import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// Rate limiter: 100 requests per 15 minutes by default
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 points
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) // per 15 minutes
});

/**
 * Rate limiting middleware
 */
export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (err) {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
}

export default rateLimiterMiddleware;