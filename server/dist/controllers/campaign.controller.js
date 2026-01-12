"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCampaign = exports.duplicateCampaign = exports.generateAssets = exports.deleteCampaign = exports.updateCampaign = exports.createCampaign = exports.getCampaign = exports.getCampaigns = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../config/constants");
const generation_service_1 = require("../services/generation.service");
// @desc    Get all campaigns for user
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, limit = 10, page = 1 } = req.query;
    const query = { userId: req.userId };
    if (status) {
        query.status = status;
    }
    const campaigns = await models_1.Campaign.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('segments.audienceId', 'name propensityLevel');
    const total = await models_1.Campaign.countDocuments(query);
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
exports.getCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const campaign = await models_1.Campaign.findOne({
        _id: req.params.id,
        userId: req.userId
    }).populate('segments.audienceId', 'name description propensityLevel');
    if (!campaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    // Get associated assets
    const assets = await models_1.Asset.find({ campaignId: campaign._id });
    res.json({
        success: true,
        data: {
            campaign,
            assets,
            stats: {
                segmentCount: campaign.segments.length,
                channelCount: campaign.channels.filter(c => c.enabled).length,
                assetCount: assets.length,
                expectedAssetCount: campaign.expectedAssetCount,
            }
        },
    });
});
// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check campaign limit
    const campaignCount = await models_1.Campaign.countDocuments({ userId: req.userId });
    if (campaignCount >= constants_1.LIMITS.MAX_CAMPAIGNS_PER_USER) {
        throw new errorHandler_1.AppError(`Maximum ${constants_1.LIMITS.MAX_CAMPAIGNS_PER_USER} campaigns allowed per user`, 400);
    }
    // Verify brand guide exists
    const brandGuide = await models_1.BrandGuide.findOne({ userId: req.userId });
    if (!brandGuide) {
        throw new errorHandler_1.AppError('Please create a brand guide before creating campaigns', 400);
    }
    // Verify all audience IDs belong to this user
    if (req.body.segments && req.body.segments.length > 0) {
        const audienceIds = req.body.segments.map((s) => s.audienceId);
        const audiences = await models_1.Audience.find({
            _id: { $in: audienceIds },
            userId: req.userId
        });
        if (audiences.length !== audienceIds.length) {
            throw new errorHandler_1.AppError('One or more audience IDs are invalid', 400);
        }
    }
    const campaign = await models_1.Campaign.create({
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
exports.updateCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    let campaign = await models_1.Campaign.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!campaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    // Verify audience IDs if segments are being updated
    if (req.body.segments && req.body.segments.length > 0) {
        const audienceIds = req.body.segments.map((s) => s.audienceId);
        const audiences = await models_1.Audience.find({
            _id: { $in: audienceIds },
            userId: req.userId
        });
        if (audiences.length !== audienceIds.length) {
            throw new errorHandler_1.AppError('One or more audience IDs are invalid', 400);
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
            campaign[field] = req.body[field];
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
exports.deleteCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const campaign = await models_1.Campaign.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!campaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    // Delete associated assets
    await models_1.Asset.deleteMany({ campaignId: campaign._id });
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
exports.generateAssets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const campaign = await models_1.Campaign.findOne({
        _id: req.params.id,
        userId: req.userId
    }).populate('segments.audienceId');
    if (!campaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    // Verify campaign has segments and channels
    if (!campaign.segments || campaign.segments.length === 0) {
        throw new errorHandler_1.AppError('Campaign must have at least one segment', 400);
    }
    const enabledChannels = campaign.channels.filter(c => c.enabled);
    if (enabledChannels.length === 0) {
        throw new errorHandler_1.AppError('Campaign must have at least one enabled channel', 400);
    }
    // Get brand guide
    const brandGuide = await models_1.BrandGuide.findById(campaign.brandGuideId);
    if (!brandGuide) {
        throw new errorHandler_1.AppError('Brand guide not found', 404);
    }
    try {
        // Generate assets using AI service
        const assets = await (0, generation_service_1.generateCampaignAssets)(campaign, brandGuide);
        // Update campaign status
        campaign.status = constants_1.CAMPAIGN_STATUS.GENERATED;
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
    }
    catch (error) {
        throw new errorHandler_1.AppError(`Asset generation failed: ${error.message}`, 500);
    }
});
// @desc    Duplicate campaign
// @route   POST /api/campaigns/:id/duplicate
// @access  Private
exports.duplicateCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const originalCampaign = await models_1.Campaign.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!originalCampaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    // Check campaign limit
    const campaignCount = await models_1.Campaign.countDocuments({ userId: req.userId });
    if (campaignCount >= constants_1.LIMITS.MAX_CAMPAIGNS_PER_USER) {
        throw new errorHandler_1.AppError(`Maximum ${constants_1.LIMITS.MAX_CAMPAIGNS_PER_USER} campaigns allowed per user`, 400);
    }
    // Create duplicate - extract only the fields we need
    const { _id, createdAt, updatedAt, ...campaignFields } = originalCampaign.toObject();
    const duplicateData = {
        ...campaignFields,
        name: `${originalCampaign.name} (Copy)`,
        status: constants_1.CAMPAIGN_STATUS.DRAFT,
    };
    const newCampaign = await models_1.Campaign.create(duplicateData);
    res.status(201).json({
        success: true,
        message: 'Campaign duplicated successfully',
        data: { campaign: newCampaign },
    });
});
// @desc    Export campaign
// @route   GET /api/campaigns/:id/export
// @access  Private
exports.exportCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const campaign = await models_1.Campaign.findOne({
        _id: req.params.id,
        userId: req.userId
    })
        .populate('segments.audienceId')
        .populate('brandGuideId');
    if (!campaign) {
        throw new errorHandler_1.AppError('Campaign not found', 404);
    }
    const assets = await models_1.Asset.find({ campaignId: campaign._id });
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
        segments: campaign.segments.map((seg) => ({
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
//# sourceMappingURL=campaign.controller.js.map