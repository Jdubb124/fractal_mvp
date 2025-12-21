import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { PROPENSITY_LEVELS, CHANNEL_TYPES, URGENCY_LEVELS } from '../config/constants';

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: (err as any).path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Common validators
export const validateObjectId = (field: string) => {
  return param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);
};

// Auth validators
export const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Brand Guide validators
export const validateBrandGuide = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry cannot exceed 100 characters'),
  body('voiceAttributes')
    .optional()
    .isArray()
    .withMessage('Voice attributes must be an array'),
  body('voiceAttributes.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each voice attribute cannot exceed 50 characters'),
  body('toneGuidelines')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Tone guidelines cannot exceed 2000 characters'),
  body('valueProposition')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Value proposition cannot exceed 1000 characters'),
  body('keyMessages')
    .optional()
    .isArray()
    .withMessage('Key messages must be an array'),
  body('avoidPhrases')
    .optional()
    .isArray()
    .withMessage('Avoid phrases must be an array'),
  body('primaryColors')
    .optional()
    .isArray()
    .withMessage('Primary colors must be an array'),
  body('primaryColors.*')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Each color must be a valid hex code'),
  handleValidationErrors,
];

// Audience validators
export const validateAudience = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Audience name is required')
    .isLength({ max: 100 })
    .withMessage('Audience name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('propensityLevel')
    .optional()
    .isIn(Object.values(PROPENSITY_LEVELS))
    .withMessage(`Propensity level must be one of: ${Object.values(PROPENSITY_LEVELS).join(', ')}`),
  body('demographics.ageRange.min')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Minimum age must be between 0 and 120'),
  body('demographics.ageRange.max')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Maximum age must be between 0 and 120'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('painPoints')
    .optional()
    .isArray()
    .withMessage('Pain points must be an array'),
  body('keyMotivators')
    .optional()
    .isArray()
    .withMessage('Key motivators must be an array'),
  handleValidationErrors,
];

// Campaign validators
export const validateCampaign = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ max: 200 })
    .withMessage('Campaign name cannot exceed 200 characters'),
  body('objective')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Objective cannot exceed 1000 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('segments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Cannot have more than 5 segments'),
  body('segments.*.audienceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid audience ID'),
  body('channels')
    .optional()
    .isArray({ max: 2 })
    .withMessage('Cannot have more than 2 channels'),
  body('channels.*.type')
    .optional()
    .isIn(Object.values(CHANNEL_TYPES))
    .withMessage(`Channel type must be one of: ${Object.values(CHANNEL_TYPES).join(', ')}`),
  body('urgencyLevel')
    .optional()
    .isIn(Object.values(URGENCY_LEVELS))
    .withMessage(`Urgency level must be one of: ${Object.values(URGENCY_LEVELS).join(', ')}`),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  handleValidationErrors,
];

// Asset validators
export const validateAssetUpdate = [
  body('versions.*.versionName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Version name cannot exceed 100 characters'),
  body('versions.*.content')
    .optional()
    .isObject()
    .withMessage('Content must be an object'),
  handleValidationErrors,
];