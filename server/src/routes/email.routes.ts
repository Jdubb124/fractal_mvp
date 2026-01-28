import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  generateEmails,
  getEmailAssetsByCampaign,
  getEmailAsset,
  exportEmail,
  bulkExportEmails,
  updateEmail,
  aiEditEmail,
  approveEmail,
  deleteEmailAssetsByCampaign,
} from '../controllers/email.controller';
import {
  validateGenerateEmails,
  validateExport,
  validateBulkExport,
  validateUpdateEmail,
  validateAIEdit,
} from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Generation
router.post('/generate', validateGenerateEmails, generateEmails);

// Retrieval
router.get('/campaign/:campaignId', getEmailAssetsByCampaign);
router.get('/:assetId', getEmailAsset);

// Export
router.get('/:assetId/export', validateExport, exportEmail);
router.post('/export/bulk', validateBulkExport, bulkExportEmails);

// Editing
router.put('/:assetId', validateUpdateEmail, updateEmail);
router.post('/:assetId/ai-edit', validateAIEdit, aiEditEmail);

// Status
router.patch('/:assetId/approve', approveEmail);

// Deletion
router.delete('/campaign/:campaignId', deleteEmailAssetsByCampaign);

export default router;
