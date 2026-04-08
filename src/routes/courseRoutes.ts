// d:\PROJETS\COURS REACT\e-l\backend\src\routes\courseRoutes.ts
import { Router } from 'express';
import { createCourse, getAllCourses, getTeacherCourses, updateCourse, deleteCourse, getCourseEnrollments, addCourseEnrollment, removeCourseEnrollment, enrollInCourse, getAllEnrollments, deleteEnrollment, addModule, addContent, getCourseDetails, getEnrolledCourses } from '../controllers/courseController';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/', getAllCourses);
router.get('/enrolled', protect, getEnrolledCourses);
router.get('/teacher/my', protect, authorize('TEACHER', 'ADMIN'), getTeacherCourses);
router.get('/:id/enrollments', protect, authorize('TEACHER', 'ADMIN'), getCourseEnrollments);
router.post('/:id/enrollments', protect, authorize('TEACHER', 'ADMIN'), addCourseEnrollment);
router.delete('/:id/enrollments/:enrollmentId', protect, authorize('TEACHER', 'ADMIN'), removeCourseEnrollment);
router.get('/:id', protect, getCourseDetails);
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createCourse);
router.patch('/:id', protect, authorize('TEACHER', 'ADMIN'), updateCourse);
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN'), deleteCourse);
router.post('/enroll', protect, enrollInCourse);

// Content Management
router.post('/module', protect, authorize('TEACHER', 'ADMIN'), addModule);
router.post('/content', protect, authorize('TEACHER', 'ADMIN'), upload.single('file'), addContent);

// Admin Enrollments
router.get('/enrollments', protect, authorize('ADMIN'), getAllEnrollments);
router.delete('/enrollments/:id', protect, authorize('ADMIN'), deleteEnrollment);

export default router;
