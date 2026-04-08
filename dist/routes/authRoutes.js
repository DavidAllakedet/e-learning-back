"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\routes\authRoutes.ts
const express_1 = require("express");
const authController_1 = require("../controllers/authController"); // Importation nommée correcte
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
exports.default = router;
