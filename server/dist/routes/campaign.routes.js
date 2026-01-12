"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("../controllers/campaign.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
router.route('/')
    .get(campaign_controller_1.getCampaigns)
    .post(validation_1.validateCampaign, campaign_controller_1.createCampaign);
router.route('/:id')
    .get(campaign_controller_1.getCampaign)
    .put(validation_1.validateCampaign, campaign_controller_1.updateCampaign)
    .delete(campaign_controller_1.deleteCampaign);
// Campaign actions
router.post('/:id/generate', campaign_controller_1.generateAssets);
router.post('/:id/duplicate', campaign_controller_1.duplicateCampaign);
router.get('/:id/export', campaign_controller_1.exportCampaign);
exports.default = router;
//# sourceMappingURL=campaign.routes.js.map