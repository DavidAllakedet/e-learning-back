// d:\PROJETS\COURS REACT\e-l\backend\src\index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import quizRoutes from './routes/quizRoutes';
import progressRoutes from './routes/progressRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import path from 'path';
import prisma from './config/db';

dotenv.config();
const app = express();

// Test database connection on startup
console.log('Testing database connection...');
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

app.use(helmet({
  crossOriginResourcePolicy: false, // Nécessaire pour servir les images/vidéos localement
}));
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes); // Ajout des routes de quiz
app.use('/api/progress', progressRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Middleware global de gestion des erreurs (doit être après les routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));