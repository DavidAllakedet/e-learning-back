// d:\PROJETS\COURS REACT\e-l\backend\src\index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import quizRoutes from './routes/quizRoutes'; // Importation des routes de quiz
import { errorHandler } from './middleware/errorMiddleware';
import path from 'path'; // Pour servir les fichiers statiques

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes); // Ajout des routes de quiz

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Middleware global de gestion des erreurs (doit être après les routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));