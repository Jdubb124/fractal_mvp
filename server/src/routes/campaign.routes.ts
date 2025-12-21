import { Router } from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  generateAssets,
  duplicateCampaign,
  exportCampaign,
} from '../controllers/campaign.controller';
import { protect } from '../middleware/auth';
import { validateCampaign } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getCampaigns)
  .post(validateCampaign, createCampaign);

router.route('/:id')
  .get(getCampaign)
  .put(validateCampaign, updateCampaign)
  .delete(deleteCampaign);

// Campaign actions
router.post('/:id/generate', generateAssets);
router.post('/:id/duplicate', duplicateCampaign);
router.get('/:id/export', exportCampaign);

export default router;