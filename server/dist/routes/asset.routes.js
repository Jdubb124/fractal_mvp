"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asset_controller_1 = require("../controllers/asset.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Get assets by campaign
router.get('/campaign/:campaignId', asset_controller_1.getAssetsByCampaign);
// Single asset operations
router.route('/:id')
    .get(asset_controller_1.getAsset)
    .put(validation_1.validateAssetUpdate, asset_controller_1.updateAsset)
    .delete(asset_controller_1.deleteAsset);
// Version operations
router.put('/:id/versions/:versionId', asset_controller_1.updateVersion);
router.patch('/:id/versions/:versionId/approve', asset_controller_1.approveVersion);
// Regenerate asset
router.post('/:id/regenerate', asset_controller_1.regenerate);
exports.default = router;
//# sourceMappingURL=asset.routes.js.map