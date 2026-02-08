import { Router } from 'express';
import {
  getAsset,
  updateAsset,
  updateVersion,
  approveVersion,
  regenerate,
  regenerateVersion,
  deleteAsset,
  getAssetsByCampaign,
} from '../controllers/asset.controller';
import { protect } from '../middleware/auth';
import { validateAssetUpdate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Get assets by campaign
router.get('/campaign/:campaignId', getAssetsByCampaign);

// Single asset operations
router.route('/:id')
  .get(getAsset)
  .put(validateAssetUpdate, updateAsset)
  .delete(deleteAsset);

// Version operations
router.put('/:id/versions/:versionId', updateVersion);
router.patch('/:id/versions/:versionId/approve', approveVersion);

// Regenerate asset
router.post('/:id/regenerate', regenerate);

// Regenerate specific version
router.post('/:assetId/versions/:versionId/regenerate', regenerateVersion);

export default router;