// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\assignmentController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';
import path from 'path';
import { createNotification } from './notificationController';

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

    // Notifier les étudiants inscrits
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true }
    });

    for (const enrollment of enrollments) {
      await createNotification(
        enrollment.userId,
        'Nouveau devoir',
        `Un nouveau devoir "${title}" a été ajouté.`,
        'INFO'
      );
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du devoir' });
  }
};

// Obtenir un devoir par ID
export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: { select: { title: true } },
        submissions: {
          where: { userId },
          include: { grade: true }
        }
      }
    });

    if (!assignment) return res.status(404).json({ message: 'Devoir non trouvé' });

    const submission = assignment.submissions[0];
    let status = 'pending';
    if (submission) {
      status = submission.grade ? 'graded' : 'submitted';
    }

    res.json({
      ...assignment,
      courseTitle: assignment.course.title,
      status,
      submission,
      grade: submission?.grade
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du devoir' });
  }
};

// Obtenir les soumissions pour un enseignant
export const getSubmissionsByTeacher = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const submissions = await prisma.submission.findMany({
      where: {
        assignment: { course: { teacherId } }
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        assignment: { select: { title: true } },
        grade: true
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des soumissions' });
  }
};

// Obtenir les devoirs d'un étudiant (uniquement ses cours)
export const getStudentAssignments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const assignments = await prisma.assignment.findMany({
      where: {
        course: {
          enrollments: {
            some: { userId }
          }
        }
      },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          where: { userId },
          include: { grade: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const mapped = assignments.map(a => {
      const submission = a.submissions[0];
      let status = 'pending';
      if (submission) status = submission.grade ? 'graded' : 'submitted';
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        course: a.course,
        status,
        submission,
        grade: submission?.grade || null
      };
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des devoirs' });
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
      include: {
        submission: {
          select: { userId: true, assignment: { select: { title: true } } }
        }
      }
    });

    // Notifier l'étudiant
    await createNotification(
      grade.submission.userId,
      'Note reçue',
      `Votre devoir "${grade.submission.assignment.title}" a été noté.`,
      'SUCCESS'
    );

    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la notation' });
  }
};
