// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\courseController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

// Course Controller
export const createCourse = async (req: Request, res: Response) => {
  const { title, description, price } = req.body;
  const teacherId = (req as any).user.id;
  try {
    const course = await prisma.course.create({
      data: { title, description, price: parseFloat(price), teacherId }
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du cours' });
  }
};

export const getAllCourses = async (_req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: { teacher: { select: { firstName: true, lastName: true } } }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des cours' });
  }
};

export const enrollInCourse = async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const userId = (req as any).user.id;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId }
    });
    res.status(201).json({ message: 'Inscription réussie', enrollment });
  } catch (error) {
    res.status(400).json({ message: 'Déjà inscrit ou erreur lors de l\'inscription' });
  }
};

export const getAllEnrollments = async (_req: Request, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true } }
      }
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions' });
  }
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.enrollment.delete({ where: { id } });
    res.json({ message: 'Inscription supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'inscription' });
  }
};

export const addModule = async (req: Request, res: Response) => {
  const { title, courseId } = req.body;
  try {
    const module = await prisma.courseModule.create({
      data: { title, courseId }
    });
    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du module' });
  }
};

export const addContent = async (req: Request, res: Response) => {
  const { title, type, moduleId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'Aucun fichier uploadé' });
  }

  try {
    const subDir = type === 'VIDEO' ? 'videos' : 'pdfs';
    const url = `/uploads/${subDir}/${file.filename}`;
    
    const content = await prisma.courseContent.create({
      data: { title, type, url, moduleId }
    });
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du contenu' });
  }
};

export const getCourseDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        modules: {
          include: { contents: true }
        }
      }
    });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du cours' });
  }
};