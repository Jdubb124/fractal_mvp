"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetsByCampaign = exports.deleteAsset = exports.regenerate = exports.approveVersion = exports.updateVersion = exports.updateAsset = exports.getAsset = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../config/constants");
const generation_service_1 = require("../services/generation.service");
// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
exports.getAsset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const asset = await models_1.Asset.findById(req.params.id)
        .populate('campaignId', 'name userId')
        .populate('audienceId', 'name description');
    if (!asset) {
        throw new errorHandler_1.AppError('Asset not found', 404);
    }
    // Verify ownership through campaign
    const campaign = asset.campaignId;
    if (campaign.userId.toString() !== req.userId) {
        throw new errorHandler_1.AppError('Not authorized to access this asset', 403);
    }
    res.json({
        success: true,
        data: { asset },
    });
});
// @desc    Update asset (manual edits)
// @route   PUT /api/assets/:id
// @access  Private
exports.updateAsset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const asset = await models_1.Asset.findById(req.params.id)
        .populate('campaignId', 'userId');
    if (!asset) {
        throw new errorHandler_1.AppError('Asset not found', 404);
    }
    // Verify ownership through campaign
    const campaign = asset.campaignId;
    if (campaign.userId.toString() !== req.userId) {
        throw new errorHandler_1.AppError('Not authorized to update this asset', 403);
    }
    // Update asset name if provided
    if (req.body.name) {
        asset.name = req.body.name;
    }
    // Update versions if provided
    if (req.body.versions) {
        req.body.versions.forEach((updateVersion) => {
            const existingVersion = asset.versions.find(v => v._id?.toString() === updateVersion._id ||
                v.versionName === updateVersion.versionName);
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
                existingVersion.status = constants_1.ASSET_STATUS.EDITED;
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
exports.updateVersion = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const asset = await models_1.Asset.findById(req.params.id)
        .populate('campaignId', 'userId');
    if (!asset) {
        throw new errorHandler_1.AppError('Asset not found', 404);
    }
    // Verify ownership through campaign
    const campaign = asset.campaignId;
    if (campaign.userId.toString() !== req.userId) {
        throw new errorHandler_1.AppError('Not authorized to update this asset', 403);
    }
    // Find the version
    const version = asset.versions.find(v => v._id?.toString() === req.params.versionId);
    if (!version) {
        throw new errorHandler_1.AppError('Version not found', 404);
    }
    // Update version fields
    const { content, versionName, status } = req.body;
    if (content) {
        version.content = { ...version.content, ...content };
    }
    if (versionName) {
        version.versionName = versionName;
    }
    if (status && Object.values(constants_1.ASSET_STATUS).includes(status)) {
        version.status = status;
    }
    version.editedAt = new Date();
    if (!status) {
        version.status = constants_1.ASSET_STATUS.EDITED;
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
exports.approveVersion = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const asset = await models_1.Asset.findById(req.params.id)
        .populate('campaignId', 'userId');
    if (!asset) {
        throw new errorHandler_1.AppError('Asset not found', 404);
    }
    // Verify ownership
    const campaign = asset.campaignId;
    if (campaign.userId.toString() !== req.userId) {
        throw new errorHandler_1.AppError('Not authorized', 403);
    }
    // Find and approve the version
    const version = asset.versions.find(v => v._id?.toString() === req.params.versionId);
    if (!version) {
        throw new errorHandler_1.AppError('Version not found', 404);
    }
    version.status = constants_1.ASSET_STATUS.APPROVED;
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
exports.regenerate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const asset = await models_1.Asset.findById(req.params.id)
        .populate('campaignId')
        .populate('audienceId');
    if (!asset) {
        throw new errorHandler_1.AppError('Asset not found', 404);
    }
    // Verify ownership
    const campaign = asset.campaignId;
    if (campaign.userId.toString() !== req.userId) {
        throw new errorHandler_1.AppError('Not authorized', 403);
    }
    // Get optional regeneration instructions
    const { instructions, strategy } = req.body;
    try {
        const updatedAsset = await (0, generation_service_1.regenerateAsset)(asset, instructions, strategy);
        res.json({
            success: true,
            message: 'Asset regenerated successfully',
            data: { asset: updatedAsset },
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError(`Regeneration failed: ${error.message}`, 500);
    }
});
// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private
exports.deleteAsset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const asset = await models_1.Asset.findById(req.params.id)
        .populate('campaignId', 'userId');
    if (!asset) {
        throw new errorHandler_1.AppError('Asset not found', 404);
    }
    // Verify ownership
    const campaign = asset.campaignId;
    if (campaign.userId.toString() !== req.userId) {
        throw new errorHandler_1.AppError('Not authorized', 403);
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
exports.getAssetsByCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Verify campaign ownership
    const campaign = await models_1.Campaign.findOne({
        _id: req.params.campaignId,
        userId: req.userId,
    });
    if (!campaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    const { channelType, audienceId } = req.query;
    const query = { campaignId: req.params.campaignId };
    if (channelType) {
        query.channelType = channelType;
    }
    if (audienceId) {
        query.audienceId = audienceId;
    }
    const assets = await models_1.Asset.find(query)
        .populate('audienceId', 'name')
        .sort({ channelType: 1, createdAt: 1 });
    res.json({
        success: true,
        count: assets.length,
        data: { assets },
    });
});
//# sourceMappingURL=asset.controller.js.map