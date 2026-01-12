"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateMe = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, name, company } = req.body;
    // Check if user already exists
    const existingUser = await models_1.User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new errorHandler_1.AppError('User with this email already exists', 400);
    }
    // Create user
    const user = await models_1.User.create({
        email,
        password,
        name,
        company,
    });
    // Generate token
    const token = (0, auth_1.generateToken)(user._id.toString());
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                company: user.company,
            },
            token,
        },
    });
});
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user by email (include password for comparison)
    const user = await models_1.User.findByEmail(email);
    if (!user) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Generate token
    const token = (0, auth_1.generateToken)(user._id.toString());
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                company: user.company,
            },
            token,
        },
    });
});
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // For JWT, logout is handled client-side by removing the token
    // This endpoint exists for API consistency and potential token blacklisting
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await models_1.User.findById(req.userId);
    if (!user) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                company: user.company,
                createdAt: user.createdAt,
            },
        },
    });
});
// @desc    Update current user
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, company } = req.body;
    const user = await models_1.User.findByIdAndUpdate(req.userId, { name, company }, { new: true, runValidators: true });
    if (!user) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                company: user.company,
            },
        },
    });
});
// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // Get user with password
    const user = await models_1.User.findById(req.userId).select('+password');
    if (!user) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new errorHandler_1.AppError('Current password is incorrect', 401);
    }
    // Update password
    user.password = newPassword;
    await user.save();
    // Generate new token
    const token = (0, auth_1.generateToken)(user._id.toString());
    res.json({
        success: true,
        message: 'Password changed successfully',
        data: { token },
    });
});
//# sourceMappingURL=auth.controller.js.map