// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\courseController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';
import { createNotification } from './notificationController';

// Course Controller
export const getEnrolledCourses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            modules: {
              include: { contents: true }
            },
            quizzes: {
              include: {
                results: {
                  where: { userId }
                }
              }
            }
          }
        },
        progress: true
      }
    });

    const coursesWithProgress = enrollments.map(e => {
      const totalContents = e.course.modules.reduce((acc, mod) => acc + mod.contents.length, 0);
      const totalQuizzes = e.course.quizzes.length;
      const totalItems = totalContents + totalQuizzes;

      const completedContents = e.progress.filter(p => p.completed).length;
      const completedQuizzes = e.course.quizzes.filter(q => q.results.length > 0).length;
      const completedItems = completedContents + completedQuizzes;

      const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...e.course,
        progress: percentage
      };
    });

    res.json(coursesWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des cours inscrits' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  console.log('=== COURSE CREATION REQUEST ===');
  console.log('Body:', req.body);
  console.log('User:', (req as any).user);

  const { title, description, price = 0 } = req.body;
  const teacherId = (req as any).user.id;

  console.log('Parsed data:', { title, description, price, teacherId });

  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connected successfully');

    const course = await prisma.course.create({
      data: { title, description, price: parseFloat(price), teacherId, status: 'DRAFT' }
    });
    console.log('Course created successfully:', course);
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Erreur lors de la création du cours', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }

    const pageQuery = req.query.page;
    const limitQuery = req.query.limit;
    const hasPagination = pageQuery !== undefined || limitQuery !== undefined;

    const page = Math.max(1, Number.parseInt(String(pageQuery ?? '1'), 10) || 1);
    const limit = Math.max(1, Math.min(60, Number.parseInt(String(limitQuery ?? '12'), 10) || 12));

    if (hasPagination) {
      const [total, items] = await Promise.all([
        prisma.course.count({ where }),
        prisma.course.findMany({
          where,
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { enrollments: true } }
          },
          orderBy: { title: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        })
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));
      res.setHeader('X-Total-Count', String(total));
      res.setHeader('X-Total-Pages', String(totalPages));
      res.setHeader('X-Page', String(page));
      res.setHeader('X-Limit', String(limit));
      res.json({ items, meta: { page, limit, total, totalPages } });
      return;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { enrollments: true } }
      },
      orderBy: { title: 'asc' }
    });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des cours' });
  }
};

export const getTeacherCourses = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { enrollments: true, modules: true } }
      },
      orderBy: { title: 'asc' }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des cours enseignant' });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;
    const { title, description, price, status } = req.body;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        title: typeof title === 'string' ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        status: typeof status === 'string' ? status : undefined,
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du cours' });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await prisma.$transaction([
      prisma.grade.deleteMany({ where: { submission: { assignment: { courseId: id } } } }),
      prisma.submission.deleteMany({ where: { assignment: { courseId: id } } }),
      prisma.assignment.deleteMany({ where: { courseId: id } }),
      prisma.quizResult.deleteMany({ where: { quiz: { courseId: id } } }),
      prisma.question.deleteMany({ where: { quiz: { courseId: id } } }),
      prisma.quiz.deleteMany({ where: { courseId: id } }),
      prisma.progress.deleteMany({ where: { enrollment: { courseId: id } } }),
      prisma.enrollment.deleteMany({ where: { courseId: id } }),
      prisma.courseContent.deleteMany({ where: { module: { courseId: id } } }),
      prisma.courseModule.deleteMany({ where: { courseId: id } }),
      prisma.course.delete({ where: { id } }),
    ]);
    res.json({ message: 'Cours supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du cours' });
  }
};

export const getCourseEnrollments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
      orderBy: { id: 'desc' }
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions du cours' });
  }
};

export const removeCourseEnrollment = async (req: Request, res: Response) => {
  try {
    const { id, enrollmentId } = req.params;
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.courseId !== id) {
      return res.status(404).json({ message: 'Inscription non trouvée' });
    }

    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    res.json({ message: 'Étudiant retiré du cours' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'inscription' });
  }
};

export const addCourseEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.body;
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (targetUser.role !== 'STUDENT') return res.status(400).json({ message: 'Seuls les étudiants peuvent être inscrits' });

    const enrollment = await prisma.enrollment.create({
      data: { userId: targetUserId, courseId: id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } }
    });

    await createNotification(
      targetUserId,
      'Inscription par enseignant',
      `Vous avez été inscrit au cours "${course.title}".`,
      'INFO'
    );

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: 'Déjà inscrit ou erreur lors de l\'inscription' });
  }
};

export const enrollInCourse = async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const userId = (req as any).user.id;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
      include: { course: { select: { title: true } } }
    });

    // Notification
    await createNotification(
      userId,
      'Inscription réussie',
      `Vous êtes maintenant inscrit au cours "${enrollment.course.title}".`,
      'SUCCESS'
    );

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
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

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
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true }
    });
    if (!module) return res.status(404).json({ message: 'Module non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && module.course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const subDir = type === 'VIDEO' ? 'videos' : 'pdfs';
    const url = `/uploads/${subDir}/${file.filename}`;
    
    const content = await prisma.courseContent.create({
      data: { title, type, url, moduleId },
      include: { module: { include: { course: { select: { id: true, title: true } } } } }
    });

    // Notifier les étudiants
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: content.module.course.id },
      select: { userId: true }
    });

    for (const enrollment of enrollments) {
      await createNotification(
        enrollment.userId,
        'Nouveau contenu',
        `Une nouvelle leçon "${title}" a été ajoutée au cours "${content.module.course.title}".`,
        'INFO'
      );
    }

    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du contenu' });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role as string;

    const content = await prisma.courseContent.findUnique({
      where: { id },
      include: { module: { include: { course: true } } }
    });
    if (!content) return res.status(404).json({ message: 'Contenu non trouvé' });
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && content.module.course.teacherId !== userId) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await prisma.courseContent.delete({ where: { id } });
    res.json({ message: 'Contenu supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du contenu' });
  }
};

export const getCourseDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;
  const role = (req as any).user?.role as string | undefined;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        modules: {
          include: { contents: true }
        },
        quizzes: true,
        assignments: true
      }
    });

    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

    // Vérifier si l'utilisateur est inscrit
    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: id } }
      });
      isEnrolled = !!enrollment;
    }

    const canAccessFullContent =
      role === 'ADMIN' ||
      role === 'SUPER_ADMIN' ||
      (role === 'TEACHER' && course.teacherId === userId) ||
      (role === 'STUDENT' && isEnrolled);

    if (!canAccessFullContent) {
      return res.json({
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        teacherId: course.teacherId,
        teacher: course.teacher,
        modules: [],
        quizzes: [],
        isEnrolled,
      });
    }

    res.json({ ...course, isEnrolled });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du cours' });
  }
};
