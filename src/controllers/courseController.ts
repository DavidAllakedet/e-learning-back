// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\courseController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

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

export const getAllCourses = async (req: Request, res: Response) => {
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