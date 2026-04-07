// d:\PROJETS\COURS REACT\e-l\backend\src\routes\courseRoutes.ts
import { Router } from 'express';
import { createCourse, getAllCourses, enrollInCourse } from '../controllers/courseController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAllCourses);
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createCourse);
router.post('/enroll', protect, enrollInCourse);

export default router;