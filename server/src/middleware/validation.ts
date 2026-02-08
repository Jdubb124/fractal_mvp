import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { PROPENSITY_LEVELS, CHANNEL_TYPES, URGENCY_LEVELS, EMAIL_TEMPLATES, EXPORT_FORMATS, EMAIL_GENERATION_MODES } from '../config/constants';

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
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Brand guide name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('colors')
    .optional()
    .isArray({ max: 6 })
    .withMessage('Colors must be an array with maximum 6 items'),
  body('colors.*')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Each color must be a valid hex code'),
  body('tone')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Tone cannot exceed 500 characters'),
  body('coreMessage')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Core message cannot exceed 1000 characters'),
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

// Email validators
export const validateGenerateEmails = [
  body('campaignId')
    .notEmpty()
    .withMessage('Campaign ID is required')
    .isMongoId()
    .withMessage('Invalid campaign ID format'),
  body('templateId')
    .optional()
    .isIn(Object.values(EMAIL_TEMPLATES))
    .withMessage(`Template must be one of: ${Object.values(EMAIL_TEMPLATES).join(', ')}`),
  body('regenerate')
    .optional()
    .isBoolean()
    .withMessage('Regenerate must be a boolean'),
  body('generationMode')
    .optional()
    .isIn(Object.values(EMAIL_GENERATION_MODES))
    .withMessage(`Generation mode must be one of: ${Object.values(EMAIL_GENERATION_MODES).join(', ')}`),
  handleValidationErrors,
];

export const validateExport = [
  query('format')
    .optional()
    .isIn(Object.values(EXPORT_FORMATS))
    .withMessage(`Format must be one of: ${Object.values(EXPORT_FORMATS).join(', ')}`),
  query('download')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Download must be true or false'),
  handleValidationErrors,
];

export const validateBulkExport = [
  body('assetIds')
    .isArray({ min: 1 })
    .withMessage('Asset IDs array is required with at least one ID'),
  body('assetIds.*')
    .isMongoId()
    .withMessage('Each asset ID must be a valid ID'),
  body('format')
    .optional()
    .isIn(Object.values(EXPORT_FORMATS))
    .withMessage(`Format must be one of: ${Object.values(EXPORT_FORMATS).join(', ')}`),
  body('organizationStrategy')
    .optional()
    .isIn(['flat', 'by_audience', 'by_type'])
    .withMessage('Organization strategy must be flat, by_audience, or by_type'),
  handleValidationErrors,
];

export const validateUpdateEmail = [
  body('html')
    .notEmpty()
    .withMessage('HTML content is required')
    .isString()
    .withMessage('HTML must be a string'),
  body('editType')
    .notEmpty()
    .withMessage('Edit type is required')
    .isIn(['manual', 'ai_assisted'])
    .withMessage('Edit type must be manual or ai_assisted'),
  body('prompt')
    .optional()
    .isString()
    .withMessage('Prompt must be a string')
    .isLength({ max: 1000 })
    .withMessage('Prompt cannot exceed 1000 characters'),
  handleValidationErrors,
];

export const validateAIEdit = [
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isString()
    .withMessage('Prompt must be a string')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Prompt must be between 1 and 1000 characters'),
  body('preserveStructure')
    .optional()
    .isBoolean()
    .withMessage('preserveStructure must be a boolean'),
  handleValidationErrors,
];