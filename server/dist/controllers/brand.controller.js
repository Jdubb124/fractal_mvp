"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrandContext = exports.deleteBrandGuide = exports.updateBrandGuide = exports.createBrandGuide = exports.getBrandGuide = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get user's brand guide
// @route   GET /api/brand
// @access  Private
exports.getBrandGuide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brandGuide = await models_1.BrandGuide.findOne({ userId: req.userId });
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
exports.createBrandGuide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check if user already has a brand guide
    const existing = await models_1.BrandGuide.findOne({ userId: req.userId });
    if (existing) {
        throw new errorHandler_1.AppError('Brand guide already exists. Use PUT to update.', 400);
    }
    const brandGuide = await models_1.BrandGuide.create({
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
exports.updateBrandGuide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    let brandGuide = await models_1.BrandGuide.findOne({
        _id: req.params.id,
        userId: req.userId
    });
    if (!brandGuide) {
        throw new errorHandler_1.AppError('Brand guide not found', 404);
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
            brandGuide[field] = req.body[field];
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
exports.deleteBrandGuide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brandGuide = await models_1.BrandGuide.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });
    if (!brandGuide) {
        throw new errorHandler_1.AppError('Brand guide not found', 404);
    }
    res.json({
        success: true,
        message: 'Brand guide deleted successfully',
    });
});
// @desc    Get brand guide context for AI (internal use)
// @route   N/A (used by generation service)
// @access  Internal
const getBrandContext = async (userId) => {
    const brandGuide = await models_1.BrandGuide.findOne({ userId });
    if (!brandGuide) {
        return null;
    }
    return brandGuide.fullContext;
};
exports.getBrandContext = getBrandContext;
//# sourceMappingURL=brand.controller.js.map