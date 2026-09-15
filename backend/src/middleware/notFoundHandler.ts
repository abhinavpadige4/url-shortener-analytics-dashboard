import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
}