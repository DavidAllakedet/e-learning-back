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

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    const requesterRole = (req as any).user.role as string;
    const roleFilter = String(req.query.role || '').trim();

    const where: any = {};
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }

    if (requesterRole === 'TEACHER') {
      where.role = 'STUDENT';
    } else if (roleFilter) {
      where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la recherche utilisateurs' });
  }
};

const escapeCsv = (value: unknown) => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const adminExportUsersCsv = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
    });

    const header = ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'];
    const rows = users.map(u => ([
      escapeCsv(u.id),
      escapeCsv(u.email),
      escapeCsv(u.firstName),
      escapeCsv(u.lastName),
      escapeCsv(u.role),
      escapeCsv(u.createdAt.toISOString()),
    ]).join(','));

    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'export CSV' });
  }
};

export const adminExportEnrollmentsCsv = async (_req: Request, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        course: { select: { id: true, title: true, teacherId: true } }
      }
    });

    const header = ['enrollmentId', 'userId', 'userEmail', 'userFirstName', 'userLastName', 'userRole', 'courseId', 'courseTitle', 'teacherId'];
    const rows = enrollments.map(e => ([
      escapeCsv(e.id),
      escapeCsv(e.user.id),
      escapeCsv(e.user.email),
      escapeCsv(e.user.firstName),
      escapeCsv(e.user.lastName),
      escapeCsv(e.user.role),
      escapeCsv(e.course.id),
      escapeCsv(e.course.title),
      escapeCsv(e.course.teacherId),
    ]).join(','));

    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="enrollments.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'export CSV' });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const avatar = `/uploads/avatars/${file.filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true }
    });
    res.json({ message: 'Avatar mis à jour', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'avatar' });
  }
};
