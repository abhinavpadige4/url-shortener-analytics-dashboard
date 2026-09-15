import { Router } from 'express';
import { getOriginalUrl } from '../services/urlService';
import { logClick } from '../services/clickService';
import { asyncHandler } from '../middleware/asyncHandler';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @route   GET /:shortCode
 * @desc    Redirect to original URL and log click
 * @access  Public
 */
router.get(
  '/:shortCode',
  asyncHandler(async (req, res, next) => {
    const { shortCode } = req.params;
    
    if (!shortCode || shortCode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Short code is required'
      });
    }

    // Get original URL
    const originalUrl = await getOriginalUrl(shortCode);
    
    if (!originalUrl) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Log the click (fire and forget - don't wait for it to complete)
    logClick(0, req).catch(err => {
      console.error('Failed to log click:', err);
      // Don't redirect error - continue with redirect
    });

    // Redirect to original URL
    res.redirect(302, originalUrl);
  })
);

export default router;