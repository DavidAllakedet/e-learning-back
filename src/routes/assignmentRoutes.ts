// d:\PROJETS\COURS REACT\e-l\backend\src\routes\assignmentRoutes.ts
import { Router } from 'express';
import { createAssignment, submitAssignment, gradeSubmission, getAssignmentById, getSubmissionsByTeacher, getStudentAssignments, getTeacherAssignments, updateAssignment, deleteAssignment } from '../controllers/assignmentController';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/teacher/submissions', protect, authorize('TEACHER', 'ADMIN'), getSubmissionsByTeacher);
router.get('/teacher', protect, authorize('TEACHER', 'ADMIN'), getTeacherAssignments);
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createAssignment);
router.get('/student', protect, authorize('STUDENT', 'ADMIN'), getStudentAssignments);
router.get('/:id', protect, getAssignmentById);
router.put('/:id', protect, authorize('TEACHER', 'ADMIN'), updateAssignment);
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN'), deleteAssignment);
router.post('/submit', protect, upload.single('file'), submitAssignment);
router.post('/grade', protect, authorize('TEACHER', 'ADMIN'), gradeSubmission);

export default router;
