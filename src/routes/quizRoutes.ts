// d:\PROJETS\COURS REACT\e-l\backend\src\routes\quizRoutes.ts
import { Router } from 'express';
import { createQuiz, getQuizzesByCourse, getQuizById, submitQuiz } from '../controllers/quizController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Routes pour les enseignants/admins
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createQuiz);

// Routes pour tous les utilisateurs authentifiés
router.get('/course/:courseId', protect, getQuizzesByCourse);
router.get('/:id', protect, getQuizById);
router.post('/:quizId/submit', protect, submitQuiz);

export default router;