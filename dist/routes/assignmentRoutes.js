"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\routes\assignmentRoutes.ts
const express_1 = require("express");
const assignmentController_1 = require("../controllers/assignmentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
router.get('/teacher/submissions', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), assignmentController_1.getSubmissionsByTeacher);
router.get('/teacher', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), assignmentController_1.getTeacherAssignments);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), assignmentController_1.createAssignment);
router.get('/student', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('STUDENT', 'ADMIN'), assignmentController_1.getStudentAssignments);
router.get('/:id', authMiddleware_1.protect, assignmentController_1.getAssignmentById);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), assignmentController_1.updateAssignment);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), assignmentController_1.deleteAssignment);
router.post('/submit', authMiddleware_1.protect, uploadMiddleware_1.upload.single('file'), assignmentController_1.submitAssignment);
router.post('/grade', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), assignmentController_1.gradeSubmission);
exports.default = router;
