// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\userController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const { firstName, lastName } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: (req as any).user.id },
      data: { firstName, lastName }
    });
    res.json({ message: 'Profil mis à jour', user: { firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};