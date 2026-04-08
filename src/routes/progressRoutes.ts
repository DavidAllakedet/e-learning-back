// d:\PROJETS\COURS REACT\e-l\backend\src\routes\progressRoutes.ts
import { Router } from 'express';
import { updateProgress, getCourseProgress } from '../controllers/progressController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/update', protect, updateProgress);
router.get('/course/:courseId', protect, getCourseProgress);

export default router;
