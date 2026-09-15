import { Router } from 'express';
import { createShortUrl, getAllUrls, getUrlStats } from '../services/urlService';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Validation schemas
const shortenUrlSchema = z.object({
  url: z.string().url('Please provide a valid URL')
});

/**
 * @route   POST /api/urls/shorten
 * @desc    Create a short URL
 * @access  Public
 */
router.post(
  '/shorten',
  asyncHandler(async (req, res) => {
    const result = shortenUrlSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: result.error.errors.map(err => err.message)
      });
    }

    const shortUrlData = await createShortUrl(result.data.url);
    
    res.status(201).json({
      success: true,
      data: shortUrlData
    });
  })
);

/**
 * @route   GET /api/urls
 * @desc    Get all URLs with pagination
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await getAllUrls(page, limit);
    
    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @route   GET /api/urls/:shortCode/stats
 * @desc    Get statistics for a specific short URL
 * @access  Public
 */
router.get(
  '/:shortCode/stats',
  asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    
    if (!shortCode || shortCode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Short code is required'
      });
    }

    const stats = await getUrlStats(shortCode);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

export default router;