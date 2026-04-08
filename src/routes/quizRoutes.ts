// d:\PROJETS\COURS REACT\e-l\backend\src\routes\quizRoutes.ts
import { Router } from 'express';
import { createQuiz, getQuizzesByCourse, getQuizById, getStudentQuizzes, submitQuiz, deleteQuiz } from '../controllers/quizController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Routes pour les enseignants/admins
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createQuiz);
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN'), deleteQuiz);

// Routes pour tous les utilisateurs authentifiés
router.get('/student', protect, authorize('STUDENT', 'ADMIN'), getStudentQuizzes);
router.get('/course/:courseId', protect, getQuizzesByCourse);
router.get('/:id', protect, getQuizById);
router.post('/:quizId/submit', protect, submitQuiz);

export default router;
