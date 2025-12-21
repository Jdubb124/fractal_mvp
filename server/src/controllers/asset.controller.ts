import { Request, Response } from 'express';
import { Asset, Campaign } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ASSET_STATUS } from '../config/constants';
import { regenerateAsset } from '../services/generation.service';

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
export const getAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id)
    .populate('campaignId', 'name userId')
    .populate('audienceId', 'name description');

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Verify ownership through campaign
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== req.userId) {
    throw new AppError('Not authorized to access this asset', 403);
  }

  res.json({
    success: true,
    data: { asset },
  });
});

// @desc    Update asset (manual edits)
// @route   PUT /api/assets/:id
// @access  Private
export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id)
    .populate('campaignId', 'userId');

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Verify ownership through campaign
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== req.userId) {
    throw new AppError('Not authorized to update this asset', 403);
  }

  // Update asset name if provided
  if (req.body.name) {
    asset.name = req.body.name;
  }

  // Update versions if provided
  if (req.body.versions) {
    req.body.versions.forEach((updateVersion: any) => {
      const existingVersion = asset.versions.find(
        v => v._id?.toString() === updateVersion._id || 
             v.versionName === updateVersion.versionName
      );
      
      if (existingVersion) {
        // Update existing version
        if (updateVersion.content) {
          existingVersion.content = { ...existingVersion.content, ...updateVersion.content };
        }
        if (updateVersion.versionName) {
          existingVersion.versionName = updateVersion.versionName;
        }
        if (updateVersion.status) {
          existingVersion.status = updateVersion.status;
        }
        existingVersion.editedAt = new Date();
        existingVersion.status = ASSET_STATUS.EDITED;
      }
    });
  }

  await asset.save();

  res.json({
    success: true,
    message: 'Asset updated successfully',
    data: { asset },
  });
});

// @desc    Update specific version content
// @route   PUT /api/assets/:id/versions/:versionId
// @access  Private
export const updateVersion = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id)
    .populate('campaignId', 'userId');

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Verify ownership through campaign
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== req.userId) {
    throw new AppError('Not authorized to update this asset', 403);
  }

  // Find the version
  const version = asset.versions.find(
    v => v._id?.toString() === req.params.versionId
  );

  if (!version) {
    throw new AppError('Version not found', 404);
  }

  // Update version fields
  const { content, versionName, status } = req.body;

  if (content) {
    version.content = { ...version.content, ...content };
  }
  if (versionName) {
    version.versionName = versionName;
  }
  if (status && Object.values(ASSET_STATUS).includes(status)) {
    version.status = status;
  }

  version.editedAt = new Date();
  if (!status) {
    version.status = ASSET_STATUS.EDITED;
  }

  await asset.save();

  res.json({
    success: true,
    message: 'Version updated successfully',
    data: { asset },
  });
});

// @desc    Approve version
// @route   PATCH /api/assets/:id/versions/:versionId/approve
// @access  Private
export const approveVersion = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id)
    .populate('campaignId', 'userId');

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Verify ownership
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== req.userId) {
    throw new AppError('Not authorized', 403);
  }

  // Find and approve the version
  const version = asset.versions.find(
    v => v._id?.toString() === req.params.versionId
  );

  if (!version) {
    throw new AppError('Version not found', 404);
  }

  version.status = ASSET_STATUS.APPROVED;
  await asset.save();

  res.json({
    success: true,
    message: 'Version approved successfully',
    data: { asset },
  });
});

// @desc    Regenerate asset
// @route   POST /api/assets/:id/regenerate
// @access  Private
export const regenerate = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id)
    .populate('campaignId')
    .populate('audienceId');

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Verify ownership
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== req.userId) {
    throw new AppError('Not authorized', 403);
  }

  // Get optional regeneration instructions
  const { instructions, strategy } = req.body;

  try {
    const updatedAsset = await regenerateAsset(asset, instructions, strategy);

    res.json({
      success: true,
      message: 'Asset regenerated successfully',
      data: { asset: updatedAsset },
    });
  } catch (error: any) {
    throw new AppError(`Regeneration failed: ${error.message}`, 500);
  }
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private
export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await Asset.findById(req.params.id)
    .populate('campaignId', 'userId');

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Verify ownership
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== req.userId) {
    throw new AppError('Not authorized', 403);
  }

  await asset.deleteOne();

  res.json({
    success: true,
    message: 'Asset deleted successfully',
  });
});

// @desc    Get assets by campaign
// @route   GET /api/assets/campaign/:campaignId
// @access  Private
export const getAssetsByCampaign = asyncHandler(async (req: Request, res: Response) => {
  // Verify campaign ownership
  const campaign = await Campaign.findOne({
    _id: req.params.campaignId,
    userId: req.userId,
  });

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  const { channelType, audienceId } = req.query;
  
  const query: any = { campaignId: req.params.campaignId };
  
  if (channelType) {
    query.channelType = channelType;
  }
  if (audienceId) {
    query.audienceId = audienceId;
  }

  const assets = await Asset.find(query)
    .populate('audienceId', 'name')
    .sort({ channelType: 1, createdAt: 1 });

  res.json({
    success: true,
    count: assets.length,
    data: { assets },
  });
});