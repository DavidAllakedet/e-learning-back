"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\routes\userRoutes.ts
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/profile', authMiddleware_1.protect, userController_1.getProfile);
router.put('/profile', authMiddleware_1.protect, userController_1.updateProfile);
router.get('/stats', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), userController_1.adminStats);
router.get('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), userController_1.adminListUsers);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), userController_1.adminUpdateUser);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), userController_1.adminDeleteUser);
exports.default = router;
