"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audience_controller_1 = require("../controllers/audience.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
router.route('/')
    .get(audience_controller_1.getAudiences)
    .post(validation_1.validateAudience, audience_controller_1.createAudience);
router.route('/:id')
    .get(audience_controller_1.getAudience)
    .put(validation_1.validateAudience, audience_controller_1.updateAudience)
    .delete(audience_controller_1.deleteAudience);
router.patch('/:id/toggle', audience_controller_1.toggleAudienceStatus);
exports.default = router;
//# sourceMappingURL=audience.routes.js.map