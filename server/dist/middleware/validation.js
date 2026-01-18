"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAssetUpdate = exports.validateCampaign = exports.validateAudience = exports.validateBrandGuide = exports.validateLogin = exports.validateRegister = exports.validateObjectId = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../config/constants");
// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// Common validators
const validateObjectId = (field) => {
    return (0, express_validator_1.param)(field)
        .isMongoId()
        .withMessage(`Invalid ${field} format`);
};
exports.validateObjectId = validateObjectId;
// Auth validators
exports.validateRegister = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Company name cannot exceed 200 characters'),
    exports.handleValidationErrors,
];
exports.validateLogin = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
    exports.handleValidationErrors,
];
// Brand Guide validators
exports.validateBrandGuide = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Brand guide name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    (0, express_validator_1.body)('colors')
        .optional()
        .isArray({ max: 6 })
        .withMessage('Colors must be an array with maximum 6 items'),
    (0, express_validator_1.body)('colors.*')
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage('Each color must be a valid hex code'),
    (0, express_validator_1.body)('tone')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Tone cannot exceed 500 characters'),
    (0, express_validator_1.body)('coreMessage')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Core message cannot exceed 1000 characters'),
    exports.handleValidationErrors,
];
// Audience validators
exports.validateAudience = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Audience name is required')
        .isLength({ max: 100 })
        .withMessage('Audience name cannot exceed 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    (0, express_validator_1.body)('propensityLevel')
        .optional()
        .isIn(Object.values(constants_1.PROPENSITY_LEVELS))
        .withMessage(`Propensity level must be one of: ${Object.values(constants_1.PROPENSITY_LEVELS).join(', ')}`),
    (0, express_validator_1.body)('demographics.ageRange.min')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Minimum age must be between 0 and 120'),
    (0, express_validator_1.body)('demographics.ageRange.max')
        .optional()
        .isInt({ min: 0, max: 120 })
        .withMessage('Maximum age must be between 0 and 120'),
    (0, express_validator_1.body)('interests')
        .optional()
        .isArray()
        .withMessage('Interests must be an array'),
    (0, express_validator_1.body)('painPoints')
        .optional()
        .isArray()
        .withMessage('Pain points must be an array'),
    (0, express_validator_1.body)('keyMotivators')
        .optional()
        .isArray()
        .withMessage('Key motivators must be an array'),
    exports.handleValidationErrors,
];
// Campaign validators
exports.validateCampaign = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Campaign name is required')
        .isLength({ max: 200 })
        .withMessage('Campaign name cannot exceed 200 characters'),
    (0, express_validator_1.body)('objective')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Objective cannot exceed 1000 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    (0, express_validator_1.body)('segments')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Cannot have more than 5 segments'),
    (0, express_validator_1.body)('segments.*.audienceId')
        .optional()
        .isMongoId()
        .withMessage('Invalid audience ID'),
    (0, express_validator_1.body)('channels')
        .optional()
        .isArray({ max: 2 })
        .withMessage('Cannot have more than 2 channels'),
    (0, express_validator_1.body)('channels.*.type')
        .optional()
        .isIn(Object.values(constants_1.CHANNEL_TYPES))
        .withMessage(`Channel type must be one of: ${Object.values(constants_1.CHANNEL_TYPES).join(', ')}`),
    (0, express_validator_1.body)('urgencyLevel')
        .optional()
        .isIn(Object.values(constants_1.URGENCY_LEVELS))
        .withMessage(`Urgency level must be one of: ${Object.values(constants_1.URGENCY_LEVELS).join(', ')}`),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    exports.handleValidationErrors,
];
// Asset validators
exports.validateAssetUpdate = [
    (0, express_validator_1.body)('versions.*.versionName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Version name cannot exceed 100 characters'),
    (0, express_validator_1.body)('versions.*.content')
        .optional()
        .isObject()
        .withMessage('Content must be an object'),
    exports.handleValidationErrors,
];
//# sourceMappingURL=validation.js.map