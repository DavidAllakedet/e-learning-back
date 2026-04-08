// d:\PROJETS\COURS REACT\e-l\backend\src\routes\assignmentRoutes.ts
import { Router } from 'express';
import { createAssignment, submitAssignment, gradeSubmission, getAssignmentById, getSubmissionsByTeacher, getStudentAssignments } from '../controllers/assignmentController';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/teacher/submissions', protect, authorize('TEACHER', 'ADMIN'), getSubmissionsByTeacher);
router.get('/student', protect, authorize('STUDENT', 'ADMIN'), getStudentAssignments);
router.get('/:id', protect, getAssignmentById);
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createAssignment);
router.post('/submit', protect, upload.single('file'), submitAssignment);
router.post('/grade', protect, authorize('TEACHER', 'ADMIN'), gradeSubmission);

export default router;
