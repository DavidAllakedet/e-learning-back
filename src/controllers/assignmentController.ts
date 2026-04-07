// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\assignmentController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';
import path from 'path';

// Créer un devoir (Enseignant/Admin)
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, courseId } = req.body;
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        courseId,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du devoir' });
  }
};

// Soumettre un devoir (Étudiant)
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.body;
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const ext = path.extname(file.originalname).toLowerCase();
    const subDir = ext === '.mp4' ? 'videos' : ext === '.pdf' ? 'pdfs' : 'others';

    const submission = await prisma.submission.create({
      data: {
        fileUrl: `/uploads/${subDir}/${file.filename}`,
        userId,
        assignmentId,
      },
    });
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la soumission' });
  }
};

// Noter une soumission (Enseignant/Admin)
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId, value, feedback } = req.body;
    const teacherId = (req as any).user.id;

    const grade = await prisma.grade.create({
      data: {
        value: parseFloat(value),
        feedback,
        submissionId,
        teacherId,
      },
    });
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la notation' });
  }
};