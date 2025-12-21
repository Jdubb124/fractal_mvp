import { Router } from 'express';
import {
  getBrandGuide,
  createBrandGuide,
  updateBrandGuide,
  deleteBrandGuide,
} from '../controllers/brand.controller';
import { protect } from '../middleware/auth';
import { validateBrandGuide } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getBrandGuide)
  .post(validateBrandGuide, createBrandGuide);

router.route('/:id')
  .put(validateBrandGuide, updateBrandGuide)
  .delete(deleteBrandGuide);

export default router;