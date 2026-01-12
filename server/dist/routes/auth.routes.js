"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', validation_1.validateRegister, auth_controller_1.register);
router.post('/login', validation_1.validateLogin, auth_controller_1.login);
// Protected routes
router.use(auth_1.protect); // All routes below require authentication
router.post('/logout', auth_controller_1.logout);
router.get('/me', auth_controller_1.getMe);
router.put('/me', auth_controller_1.updateMe);
router.put('/password', auth_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map