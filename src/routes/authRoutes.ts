// d:\PROJETS\COURS REACT\e-l\backend\src\routes\authRoutes.ts
import { Router } from 'express';
import { register, login } from '../controllers/authController'; // Importation nommée correcte

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;