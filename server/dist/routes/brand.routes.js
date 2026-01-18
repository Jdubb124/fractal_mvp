"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brand_controller_1 = require("../controllers/brand.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
router.route('/')
    .get(brand_controller_1.getBrandGuides)
    .post(validation_1.validateBrandGuide, brand_controller_1.createBrandGuide);
router.route('/:id')
    .get(brand_controller_1.getBrandGuide)
    .put(validation_1.validateBrandGuide, brand_controller_1.updateBrandGuide)
    .delete(brand_controller_1.deleteBrandGuide);
exports.default = router;
//# sourceMappingURL=brand.routes.js.map