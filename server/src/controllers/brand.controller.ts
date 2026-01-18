import { Request, Response } from 'express';
import { BrandGuide } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { LIMITS } from '../config/constants';

// @desc    Get all brand guides for user
// @route   GET /api/brand
// @access  Private
export const getBrandGuides = asyncHandler(async (req: Request, res: Response) => {
  const brandGuides = await BrandGuide.find({ userId: req.userId })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      brandGuides,
      count: brandGuides.length,
    },
  });
});

// @desc    Get single brand guide
// @route   GET /api/brand/:id
// @access  Private
export const getBrandGuide = asyncHandler(async (req: Request, res: Response) => {
  const brandGuide = await BrandGuide.findOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!brandGuide) {
    throw new AppError('Brand guide not found', 404);
  }

  res.json({
    success: true,
    data: { brandGuide },
  });
});

// @desc    Create brand guide
// @route   POST /api/brand
// @access  Private
export const createBrandGuide = asyncHandler(async (req: Request, res: Response) => {
  // Check limit
  const count = await BrandGuide.countDocuments({ userId: req.userId });
  if (count >= LIMITS.MAX_BRAND_GUIDES_PER_USER) {
    throw new AppError(
      `Maximum of ${LIMITS.MAX_BRAND_GUIDES_PER_USER} brand guides allowed`,
      400
    );
  }

  // Check for duplicate name
  const existing = await BrandGuide.findOne({
    userId: req.userId,
    name: req.body.name,
  });
  if (existing) {
    throw new AppError('A brand guide with this name already exists', 400);
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
    userId: req.userId,
  });

  if (!brandGuide) {
    throw new AppError('Brand guide not found', 404);
  }

  // Check for duplicate name if name is being changed
  if (req.body.name && req.body.name !== brandGuide.name) {
    const existing = await BrandGuide.findOne({
      userId: req.userId,
      name: req.body.name,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      throw new AppError('A brand guide with this name already exists', 400);
    }
  }

  // Update fields
  const allowedUpdates = ['name', 'colors', 'tone', 'coreMessage'];

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
    userId: req.userId,
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
export const getBrandContext = async (userId: string, brandGuideId?: string) => {
  let brandGuide;

  if (brandGuideId) {
    brandGuide = await BrandGuide.findOne({ _id: brandGuideId, userId });
  } else {
    // Get the first brand guide if no specific ID provided
    brandGuide = await BrandGuide.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!brandGuide) {
    return null;
  }

  return brandGuide.fullContext;
};
