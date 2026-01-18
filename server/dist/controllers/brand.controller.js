"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrandContext = exports.deleteBrandGuide = exports.updateBrandGuide = exports.createBrandGuide = exports.getBrandGuide = exports.getBrandGuides = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../config/constants");
// @desc    Get all brand guides for user
// @route   GET /api/brand
// @access  Private
exports.getBrandGuides = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brandGuides = await models_1.BrandGuide.find({ userId: req.userId })
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
exports.getBrandGuide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brandGuide = await models_1.BrandGuide.findOne({
        _id: req.params.id,
        userId: req.userId,
    });
    if (!brandGuide) {
        throw new errorHandler_1.AppError('Brand guide not found', 404);
    }
    res.json({
        success: true,
        data: { brandGuide },
    });
});
// @desc    Create brand guide
// @route   POST /api/brand
// @access  Private
exports.createBrandGuide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check limit
    const count = await models_1.BrandGuide.countDocuments({ userId: req.userId });
    if (count >= constants_1.LIMITS.MAX_BRAND_GUIDES_PER_USER) {
        throw new errorHandler_1.AppError(`Maximum of ${constants_1.LIMITS.MAX_BRAND_GUIDES_PER_USER} brand guides allowed`, 400);
    }
    // Check for duplicate name
    const existing = await models_1.BrandGuide.findOne({
        userId: req.userId,
        name: req.body.name,
    });
    if (existing) {
        throw new errorHandler_1.AppError('A brand guide with this name already exists', 400);
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
        userId: req.userId,
    });
    if (!brandGuide) {
        throw new errorHandler_1.AppError('Brand guide not found', 404);
    }
    // Check for duplicate name if name is being changed
    if (req.body.name && req.body.name !== brandGuide.name) {
        const existing = await models_1.BrandGuide.findOne({
            userId: req.userId,
            name: req.body.name,
            _id: { $ne: req.params.id },
        });
        if (existing) {
            throw new errorHandler_1.AppError('A brand guide with this name already exists', 400);
        }
    }
    // Update fields
    const allowedUpdates = ['name', 'colors', 'tone', 'coreMessage'];
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
        userId: req.userId,
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
const getBrandContext = async (userId, brandGuideId) => {
    let brandGuide;
    if (brandGuideId) {
        brandGuide = await models_1.BrandGuide.findOne({ _id: brandGuideId, userId });
    }
    else {
        // Get the first brand guide if no specific ID provided
        brandGuide = await models_1.BrandGuide.findOne({ userId }).sort({ createdAt: -1 });
    }
    if (!brandGuide) {
        return null;
    }
    return brandGuide.fullContext;
};
exports.getBrandContext = getBrandContext;
//# sourceMappingURL=brand.controller.js.map