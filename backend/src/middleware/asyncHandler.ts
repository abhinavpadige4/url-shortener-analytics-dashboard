import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to avoid try/catch boilerplate
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}