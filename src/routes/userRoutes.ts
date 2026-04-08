// d:\PROJETS\COURS REACT\e-l\backend\src\routes\userRoutes.ts
import { Router } from 'express';
import { adminDeleteUser, adminListUsers, adminStats, adminUpdateUser, getProfile, updateProfile } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.get('/stats', protect, authorize('ADMIN'), adminStats);
router.get('/', protect, authorize('ADMIN'), adminListUsers);
router.put('/:id', protect, authorize('ADMIN'), adminUpdateUser);
router.delete('/:id', protect, authorize('ADMIN'), adminDeleteUser);

export default router;
