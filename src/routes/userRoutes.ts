// d:\PROJETS\COURS REACT\e-l\backend\src\routes\userRoutes.ts
import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;