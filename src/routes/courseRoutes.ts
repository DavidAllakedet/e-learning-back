// d:\PROJETS\COURS REACT\e-l\backend\src\routes\courseRoutes.ts
import { Router } from 'express';
import { createCourse, getAllCourses, enrollInCourse, getAllEnrollments, deleteEnrollment, addModule, addContent, getCourseDetails } from '../controllers/courseController';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/', getAllCourses);
router.get('/:id', getCourseDetails);
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createCourse);
router.post('/enroll', protect, enrollInCourse);

// Content Management
router.post('/module', protect, authorize('TEACHER', 'ADMIN'), addModule);
router.post('/content', protect, authorize('TEACHER', 'ADMIN'), upload.single('file'), addContent);

// Admin Enrollments
router.get('/enrollments', protect, authorize('ADMIN'), getAllEnrollments);
router.delete('/enrollments/:id', protect, authorize('ADMIN'), deleteEnrollment);

export default router;