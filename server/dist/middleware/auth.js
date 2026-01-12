"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.generateToken = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const errorHandler_1 = require("./errorHandler");
// Protect routes - require authentication
exports.protect = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    let token;
    // Check for token in Authorization header
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (alternative)
    if (!token && req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        throw new errorHandler_1.AppError('Not authorized - no token provided', 401);
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        // Get user from database
        const user = await models_1.User.findById(decoded.id);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 401);
        }
        // Attach user to request
        req.user = user;
        req.userId = user._id.toString();
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.AppError('Not authorized - invalid token', 401);
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errorHandler_1.AppError('Not authorized - token expired', 401);
        }
        throw error;
    }
});
// Generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
};
exports.generateToken = generateToken;
// Optional auth - attach user if token exists, but don't require it
exports.optionalAuth = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            const user = await models_1.User.findById(decoded.id);
            if (user) {
                req.user = user;
                req.userId = user._id.toString();
            }
        }
        catch (error) {
            // Token invalid or expired - continue without user
        }
    }
    next();
});
//# sourceMappingURL=auth.js.map