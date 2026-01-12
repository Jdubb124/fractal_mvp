"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudienceSummary = exports.toggleAudienceStatus = exports.deleteAudience = exports.updateAudience = exports.createAudience = exports.getAudience = exports.getAudiences = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../config/constants");
// @desc    Get all audiences for user
// @route   GET /api/audiences
// @access  Private
exports.getAudiences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { active } = req.query;
    const query = { userId: req.userId };
    // Filter by active status if provided
    if (active !== undefined) {
        query.isActive = active === 'true';
    }
    const audiences = await models_1.Audience.find(query).sort({ createdAt: -1 });
    res.json({
        success: true,
        count: audiences.length,
        data: { audiences },
    });
});
// @desc    Get single audience
// @route   GET /api/audiences/:id
// @access  Private
exports.getAudience = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const audience = await models_1.Audience.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!audience) {
        throw new errorHandler_1.AppError('Audience not found', 404);
    }
    res.json({
        success: true,
        data: { audience },
    });
});
// @desc    Create audience
// @route   POST /api/audiences
// @access  Private
exports.createAudience = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check audience limit
    const audienceCount = await models_1.Audience.countDocuments({ userId: req.userId });
    if (audienceCount >= constants_1.LIMITS.MAX_AUDIENCES_PER_USER) {
        throw new errorHandler_1.AppError(`Maximum ${constants_1.LIMITS.MAX_AUDIENCES_PER_USER} audiences allowed per user`, 400);
    }
    // Check for duplicate name
    const existingName = await models_1.Audience.findOne({
        userId: req.userId,
        name: req.body.name
    });
    if (existingName) {
        throw new errorHandler_1.AppError('An audience with this name already exists', 400);
    }
    const audience = await models_1.Audience.create({
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
exports.updateAudience = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    let audience = await models_1.Audience.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!audience) {
        throw new errorHandler_1.AppError('Audience not found', 404);
    }
    // Check for duplicate name if name is being changed
    if (req.body.name && req.body.name !== audience.name) {
        const existingName = await models_1.Audience.findOne({
            userId: req.userId,
            name: req.body.name,
            _id: { $ne: req.params.id }
        });
        if (existingName) {
            throw new errorHandler_1.AppError('An audience with this name already exists', 400);
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
            audience[field] = req.body[field];
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
exports.deleteAudience = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const audience = await models_1.Audience.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!audience) {
        throw new errorHandler_1.AppError('Audience not found', 404);
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
exports.toggleAudienceStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const audience = await models_1.Audience.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!audience) {
        throw new errorHandler_1.AppError('Audience not found', 404);
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
const getAudienceSummary = async (audienceId) => {
    const audience = await models_1.Audience.findById(audienceId);
    if (!audience) {
        return null;
    }
    return audience.summary;
};
exports.getAudienceSummary = getAudienceSummary;
//# sourceMappingURL=audience.controller.js.map