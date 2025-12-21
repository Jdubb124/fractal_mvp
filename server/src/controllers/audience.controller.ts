import { Request, Response } from 'express';
import { Audience } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { LIMITS } from '../config/constants';

// @desc    Get all audiences for user
// @route   GET /api/audiences
// @access  Private
export const getAudiences = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.query;
  
  const query: any = { userId: req.userId };
  
  // Filter by active status if provided
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const audiences = await Audience.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: audiences.length,
    data: { audiences },
  });
});

// @desc    Get single audience
// @route   GET /api/audiences/:id
// @access  Private
export const getAudience = asyncHandler(async (req: Request, res: Response) => {
  const audience = await Audience.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!audience) {
    throw new AppError('Audience not found', 404);
  }

  res.json({
    success: true,
    data: { audience },
  });
});

// @desc    Create audience
// @route   POST /api/audiences
// @access  Private
export const createAudience = asyncHandler(async (req: Request, res: Response) => {
  // Check audience limit
  const audienceCount = await Audience.countDocuments({ userId: req.userId });
  if (audienceCount >= LIMITS.MAX_AUDIENCES_PER_USER) {
    throw new AppError(
      `Maximum ${LIMITS.MAX_AUDIENCES_PER_USER} audiences allowed per user`, 
      400
    );
  }

  // Check for duplicate name
  const existingName = await Audience.findOne({ 
    userId: req.userId, 
    name: req.body.name 
  });
  if (existingName) {
    throw new AppError('An audience with this name already exists', 400);
  }

  const audience = await Audience.create({
    userId: req.userId,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Audience created successfully',
    data: { audience },
  });
});

// @desc    Update audience
// @route   PUT /api/audiences/:id
// @access  Private
export const updateAudience = asyncHandler(async (req: Request, res: Response) => {
  let audience = await Audience.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!audience) {
    throw new AppError('Audience not found', 404);
  }

  // Check for duplicate name if name is being changed
  if (req.body.name && req.body.name !== audience.name) {
    const existingName = await Audience.findOne({ 
      userId: req.userId, 
      name: req.body.name,
      _id: { $ne: req.params.id }
    });
    if (existingName) {
      throw new AppError('An audience with this name already exists', 400);
    }
  }

  // Update fields
  const allowedUpdates = [
    'name',
    'description',
    'demographics',
    'propensityLevel',
    'interests',
    'painPoints',
    'preferredTone',
    'keyMotivators',
    'estimatedSize',
    'isActive',
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (audience as any)[field] = req.body[field];
    }
  });

  await audience.save();

  res.json({
    success: true,
    message: 'Audience updated successfully',
    data: { audience },
  });
});

// @desc    Delete audience
// @route   DELETE /api/audiences/:id
// @access  Private
export const deleteAudience = asyncHandler(async (req: Request, res: Response) => {
  const audience = await Audience.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!audience) {
    throw new AppError('Audience not found', 404);
  }

  // TODO: Check if audience is used in any campaigns before deleting
  // For MVP, we'll allow deletion

  await audience.deleteOne();

  res.json({
    success: true,
    message: 'Audience deleted successfully',
  });
});

// @desc    Toggle audience active status
// @route   PATCH /api/audiences/:id/toggle
// @access  Private
export const toggleAudienceStatus = asyncHandler(async (req: Request, res: Response) => {
  const audience = await Audience.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!audience) {
    throw new AppError('Audience not found', 404);
  }

  audience.isActive = !audience.isActive;
  await audience.save();

  res.json({
    success: true,
    message: `Audience ${audience.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { audience },
  });
});

// @desc    Get audience summary for AI (internal use)
// @route   N/A (used by generation service)
// @access  Internal
export const getAudienceSummary = async (audienceId: string) => {
  const audience = await Audience.findById(audienceId);
  
  if (!audience) {
    return null;
  }

  return audience.summary;
};