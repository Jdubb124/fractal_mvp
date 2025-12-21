import { Request, Response } from 'express';
import { BrandGuide } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// @desc    Get user's brand guide
// @route   GET /api/brand
// @access  Private
export const getBrandGuide = asyncHandler(async (req: Request, res: Response) => {
  const brandGuide = await BrandGuide.findOne({ userId: req.userId });

  res.json({
    success: true,
    data: {
      brandGuide: brandGuide || null,
      exists: !!brandGuide,
    },
  });
});

// @desc    Create brand guide
// @route   POST /api/brand
// @access  Private
export const createBrandGuide = asyncHandler(async (req: Request, res: Response) => {
  // Check if user already has a brand guide
  const existing = await BrandGuide.findOne({ userId: req.userId });
  if (existing) {
    throw new AppError('Brand guide already exists. Use PUT to update.', 400);
  }

  const brandGuide = await BrandGuide.create({
    userId: req.userId,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Brand guide created successfully',
    data: { brandGuide },
  });
});

// @desc    Update brand guide
// @route   PUT /api/brand/:id
// @access  Private
export const updateBrandGuide = asyncHandler(async (req: Request, res: Response) => {
  let brandGuide = await BrandGuide.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!brandGuide) {
    throw new AppError('Brand guide not found', 404);
  }

  // Update fields
  const allowedUpdates = [
    'companyName',
    'industry',
    'voiceAttributes',
    'toneGuidelines',
    'valueProposition',
    'keyMessages',
    'avoidPhrases',
    'primaryColors',
    'logoUrl',
    'targetAudience',
    'competitorContext',
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (brandGuide as any)[field] = req.body[field];
    }
  });

  await brandGuide.save();

  res.json({
    success: true,
    message: 'Brand guide updated successfully',
    data: { brandGuide },
  });
});

// @desc    Delete brand guide
// @route   DELETE /api/brand/:id
// @access  Private
export const deleteBrandGuide = asyncHandler(async (req: Request, res: Response) => {
  const brandGuide = await BrandGuide.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!brandGuide) {
    throw new AppError('Brand guide not found', 404);
  }

  res.json({
    success: true,
    message: 'Brand guide deleted successfully',
  });
});

// @desc    Get brand guide context for AI (internal use)
// @route   N/A (used by generation service)
// @access  Internal
export const getBrandContext = async (userId: string) => {
  const brandGuide = await BrandGuide.findOne({ userId });
  
  if (!brandGuide) {
    return null;
  }

  return brandGuide.fullContext;
};