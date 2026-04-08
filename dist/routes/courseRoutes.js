"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\routes\courseRoutes.ts
const express_1 = require("express");
const courseController_1 = require("../controllers/courseController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
router.get('/', courseController_1.getAllCourses);
router.get('/enrolled', authMiddleware_1.protect, courseController_1.getEnrolledCourses);
router.get('/teacher/my', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), courseController_1.getTeacherCourses);
router.get('/:id', authMiddleware_1.protect, courseController_1.getCourseDetails);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), courseController_1.createCourse);
router.post('/enroll', authMiddleware_1.protect, courseController_1.enrollInCourse);
// Content Management
router.post('/module', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), courseController_1.addModule);
router.post('/content', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('TEACHER', 'ADMIN'), uploadMiddleware_1.upload.single('file'), courseController_1.addContent);
// Admin Enrollments
router.get('/enrollments', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), courseController_1.getAllEnrollments);
router.delete('/enrollments/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('ADMIN'), courseController_1.deleteEnrollment);
exports.default = router;
