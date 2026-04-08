// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\notificationController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

export const createNotification = async (userId: string, title: string, message: string, type: string = 'INFO') => {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification', error);
  }
};
