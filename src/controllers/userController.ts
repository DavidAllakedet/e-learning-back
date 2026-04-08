// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\userController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, university: true, className: true, interests: true, institution: true, specialty: true, bio: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const { firstName, lastName, password, avatar, university, className, interests, institution, specialty, bio } = req.body;
  try {
    const data: any = { firstName, lastName, avatar, university, className, interests, institution, specialty, bio };
    if (password) {
      const bcrypt = require('bcryptjs');
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: (req as any).user.id },
      data
    });
    res.json({ message: 'Profil mis à jour', user: { firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

export const adminListUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

export const adminUpdateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, firstName, lastName, role, password } = req.body;
  try {
    const data: any = { email, firstName, lastName, role };
    if (password) {
      const bcrypt = require('bcryptjs');
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour utilisateur' });
  }
};

export const adminDeleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression utilisateur' });
  }
};

export const adminStats = async (_req: Request, res: Response) => {
  try {
    const [users, courses, enrollments, assignments] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.assignment.count(),
    ]);
    res.json({ users, courses, enrollments, assignments });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};
