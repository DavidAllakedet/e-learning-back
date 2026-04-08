"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\routes\progressRoutes.ts
const express_1 = require("express");
const progressController_1 = require("../controllers/progressController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/update', authMiddleware_1.protect, progressController_1.updateProgress);
router.get('/course/:courseId', authMiddleware_1.protect, progressController_1.getCourseProgress);
exports.default = router;
