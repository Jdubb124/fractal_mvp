import { Request, Response } from 'express';
import { Campaign, BrandGuide, Audience, Asset } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { LIMITS, CAMPAIGN_STATUS } from '../config/constants';
import { generateCampaignAssets } from '../services/generation.service';

// @desc    Get all campaigns for user
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = 10, page = 1 } = req.query;
  
  const query: any = { userId: req.userId };
  
  if (status) {
    query.status = status;
  }

  const campaigns = await Campaign.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .populate('segments.audienceId', 'name propensityLevel');

  const total = await Campaign.countDocuments(query);

  res.json({
    success: true,
    count: campaigns.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: { campaigns },
  });
});

// @desc    Get single campaign with assets
// @route   GET /api/campaigns/:id
// @access  Private
export const getCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (campaign && campaign.segments && campaign.segments.length > 0) {
    await campaign.populate('segments.audienceId', 'name description propensityLevel');
  }

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Get associated assets
  const assets = await Asset.find({ campaignId: campaign._id });

  const segments = campaign.segments || [];
  const channels = campaign.channels || [];

  res.json({
    success: true,
    data: {
      campaign,
      assets,
      stats: {
        segmentCount: segments.length,
        channelCount: channels.filter(c => c.enabled).length,
        assetCount: assets.length,
        expectedAssetCount: segments.length * channels.filter(c => c.enabled).length,
      }
    },
  });
});

// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  // Check campaign limit
  const campaignCount = await Campaign.countDocuments({ userId: req.userId });
  if (campaignCount >= LIMITS.MAX_CAMPAIGNS_PER_USER) {
    throw new AppError(
      `Maximum ${LIMITS.MAX_CAMPAIGNS_PER_USER} campaigns allowed per user`, 
      400
    );
  }

  // Verify brand guide exists
  const brandGuide = await BrandGuide.findOne({ userId: req.userId });
  if (!brandGuide) {
    throw new AppError('Please create a brand guide before creating campaigns', 400);
  }

  // Verify all audience IDs belong to this user
  if (req.body.segments && req.body.segments.length > 0) {
    const audienceIds = req.body.segments.map((s: any) => s.audienceId);
    const audiences = await Audience.find({ 
      _id: { $in: audienceIds }, 
      userId: req.userId 
    });
    
    if (audiences.length !== audienceIds.length) {
      throw new AppError('One or more audience IDs are invalid', 400);
    }
  }

  const campaign = await Campaign.create({
    userId: req.userId,
    brandGuideId: brandGuide._id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: { campaign },
  });
});

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  let campaign = await Campaign.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Verify audience IDs if segments are being updated
  if (req.body.segments && req.body.segments.length > 0) {
    const audienceIds = req.body.segments.map((s: any) => s.audienceId);
    const audiences = await Audience.find({ 
      _id: { $in: audienceIds }, 
      userId: req.userId 
    });
    
    if (audiences.length !== audienceIds.length) {
      throw new AppError('One or more audience IDs are invalid', 400);
    }
  }

  // Update fields
  const allowedUpdates = [
    'name',
    'objective',
    'description',
    'status',
    'segments',
    'channels',
    'keyMessages',
    'callToAction',
    'urgencyLevel',
    'startDate',
    'endDate',
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (campaign as any)[field] = req.body[field];
    }
  });

  await campaign.save();

  res.json({
    success: true,
    message: 'Campaign updated successfully',
    data: { campaign },
  });
});

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
export const deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Delete associated assets
  await Asset.deleteMany({ campaignId: campaign._id });

  // Delete campaign
  await campaign.deleteOne();

  res.json({
    success: true,
    message: 'Campaign and associated assets deleted successfully',
  });
});

// @desc    Generate assets for campaign
// @route   POST /api/campaigns/:id/generate
// @access  Private
export const generateAssets = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  }).populate('segments.audienceId');

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Verify campaign has segments and channels
  if (!campaign.segments || campaign.segments.length === 0) {
    throw new AppError('Campaign must have at least one segment', 400);
  }

  const enabledChannels = campaign.channels.filter(c => c.enabled);
  if (enabledChannels.length === 0) {
    throw new AppError('Campaign must have at least one enabled channel', 400);
  }

  // Get brand guide
  const brandGuide = await BrandGuide.findById(campaign.brandGuideId);
  if (!brandGuide) {
    throw new AppError('Brand guide not found', 404);
  }

  try {
    // Generate assets using AI service
    const assets = await generateCampaignAssets(campaign, brandGuide);

    // Update campaign status
    campaign.status = CAMPAIGN_STATUS.GENERATED;
    await campaign.save();

    res.json({
      success: true,
      message: `Generated ${assets.length} assets successfully`,
      data: { 
        campaign,
        assets,
        generatedCount: assets.length,
      },
    });
  } catch (error: any) {
    throw new AppError(`Asset generation failed: ${error.message}`, 500);
  }
});

// @desc    Duplicate campaign
// @route   POST /api/campaigns/:id/duplicate
// @access  Private
export const duplicateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const originalCampaign = await Campaign.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  });

  if (!originalCampaign) {
    throw new AppError('Campaign not found', 404);
  }

  // Check campaign limit
  const campaignCount = await Campaign.countDocuments({ userId: req.userId });
  if (campaignCount >= LIMITS.MAX_CAMPAIGNS_PER_USER) {
    throw new AppError(
      `Maximum ${LIMITS.MAX_CAMPAIGNS_PER_USER} campaigns allowed per user`, 
      400
    );
  }

  // Create duplicate - extract only the fields we need
  const { _id, createdAt, updatedAt, ...campaignFields } = originalCampaign.toObject();
  const duplicateData = {
    ...campaignFields,
    name: `${originalCampaign.name} (Copy)`,
    status: CAMPAIGN_STATUS.DRAFT,
  };

  const newCampaign = await Campaign.create(duplicateData);

  res.status(201).json({
    success: true,
    message: 'Campaign duplicated successfully',
    data: { campaign: newCampaign },
  });
});

// @desc    Export campaign
// @route   GET /api/campaigns/:id/export
// @access  Private
export const exportCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findOne({ 
    _id: req.params.id, 
    userId: req.userId 
  })
    .populate('segments.audienceId')
    .populate('brandGuideId');

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  const assets = await Asset.find({ campaignId: campaign._id });

  // Build export object
  const exportData = {
    exportedAt: new Date().toISOString(),
    campaign: {
      name: campaign.name,
      objective: campaign.objective,
      description: campaign.description,
      status: campaign.status,
      keyMessages: campaign.keyMessages,
      callToAction: campaign.callToAction,
      urgencyLevel: campaign.urgencyLevel,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    },
    segments: campaign.segments.map((seg: any) => ({
      audienceName: seg.audienceId?.name,
      customInstructions: seg.customInstructions,
    })),
    channels: campaign.channels,
    assets: assets.map(asset => ({
      name: asset.name,
      channelType: asset.channelType,
      assetType: asset.assetType,
      versions: asset.versions.map(v => ({
        versionName: v.versionName,
        strategy: v.strategy,
        content: v.content,
        status: v.status,
      })),
    })),
  };

  res.json({
    success: true,
    data: exportData,
  });
});