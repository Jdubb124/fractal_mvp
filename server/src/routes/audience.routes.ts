import { Router } from 'express';
import {
  getAudiences,
  getAudience,
  createAudience,
  updateAudience,
  deleteAudience,
  toggleAudienceStatus,
} from '../controllers/audience.controller';
import { protect } from '../middleware/auth';
import { validateAudience } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getAudiences)
  .post(validateAudience, createAudience);

router.route('/:id')
  .get(getAudience)
  .put(validateAudience, updateAudience)
  .delete(deleteAudience);

router.patch('/:id/toggle', toggleAudienceStatus);

export default router;