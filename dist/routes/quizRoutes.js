"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\routes\quizRoutes.ts
const express_1 = require("express");
const quizController_1 = require("../controllers/quizController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Routes pour les enseignants/admins
router.get('/teacher', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), quizController_1.getTeacherQuizzes);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), quizController_1.createQuiz);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), quizController_1.updateQuiz);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), quizController_1.deleteQuiz);
// Routes pour tous les utilisateurs authentifiés
router.get('/student', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('STUDENT', 'ADMIN'), quizController_1.getStudentQuizzes);
router.get('/course/:courseId', authMiddleware_1.protect, quizController_1.getQuizzesByCourse);
router.get('/:id', authMiddleware_1.protect, quizController_1.getQuizById);
router.post('/:quizId/submit', authMiddleware_1.protect, quizController_1.submitQuiz);
exports.default = router;
