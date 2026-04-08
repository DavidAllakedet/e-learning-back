// d:\PROJETS\COURS REACT\e-l\backend\src\routes\userRoutes.ts
import { Router } from 'express';
import { adminDeleteUser, adminExportEnrollmentsCsv, adminExportUsersCsv, adminListUsers, adminStats, adminUpdateUser, getProfile, searchUsers, updateProfile, uploadAvatar } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/avatar', protect, uploadAvatarMiddleware.single('file'), uploadAvatar);
router.get('/search', protect, authorize('TEACHER', 'ADMIN'), searchUsers);

router.get('/stats', protect, authorize('ADMIN'), adminStats);
router.get('/reports/users.csv', protect, authorize('ADMIN'), adminExportUsersCsv);
router.get('/reports/enrollments.csv', protect, authorize('ADMIN'), adminExportEnrollmentsCsv);
router.get('/', protect, authorize('ADMIN'), adminListUsers);
router.put('/:id', protect, authorize('ADMIN'), adminUpdateUser);
router.delete('/:id', protect, authorize('ADMIN'), adminDeleteUser);

export default router;
