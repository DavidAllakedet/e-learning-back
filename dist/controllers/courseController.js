"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseDetails = exports.deleteContent = exports.addContent = exports.addModule = exports.deleteEnrollment = exports.getAllEnrollments = exports.enrollInCourse = exports.addCourseEnrollment = exports.removeCourseEnrollment = exports.getCourseEnrollments = exports.deleteCourse = exports.updateCourse = exports.getTeacherCourses = exports.getAllCourses = exports.createCourse = exports.getEnrolledCourses = void 0;
const db_1 = __importDefault(require("../config/db"));
const notificationController_1 = require("./notificationController");
// Course Controller
const getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const enrollments = await db_1.default.enrollment.findMany({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des cours inscrits' });
    }
};
exports.getEnrolledCourses = getEnrolledCourses;
const createCourse = async (req, res) => {
    console.log('=== COURSE CREATION REQUEST ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    const { title, description, price = 0 } = req.body;
    const teacherId = req.user.id;
    console.log('Parsed data:', { title, description, price, teacherId });
    try {
        // Test database connection
        console.log('Testing database connection...');
        await db_1.default.$connect();
        console.log('Database connected successfully');
        const course = await db_1.default.course.create({
            data: { title, description, price: parseFloat(price), teacherId, status: 'DRAFT' }
        });
        console.log('Course created successfully:', course);
        res.status(201).json(course);
    }
    catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Erreur lors de la création du cours', error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.createCourse = createCourse;
const getAllCourses = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
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
                db_1.default.course.count({ where }),
                db_1.default.course.findMany({
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
        const courses = await db_1.default.course.findMany({
            where,
            include: {
                teacher: { select: { firstName: true, lastName: true } },
                _count: { select: { enrollments: true } }
            },
            orderBy: { title: 'asc' }
        });
        res.json(courses);
    }
    catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des cours' });
    }
};
exports.getAllCourses = getAllCourses;
const getTeacherCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const courses = await db_1.default.course.findMany({
            where: { teacherId },
            include: {
                teacher: { select: { firstName: true, lastName: true } },
                _count: { select: { enrollments: true, modules: true } }
            },
            orderBy: { title: 'asc' }
        });
        res.json(courses);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des cours enseignant' });
    }
};
exports.getTeacherCourses = getTeacherCourses;
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const { title, description, price, status } = req.body;
        const course = await db_1.default.course.findUnique({ where: { id } });
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        const updated = await db_1.default.course.update({
            where: { id },
            data: {
                title: typeof title === 'string' ? title : undefined,
                description: typeof description === 'string' ? description : undefined,
                price: price !== undefined ? parseFloat(price) : undefined,
                status: typeof status === 'string' ? status : undefined,
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du cours' });
    }
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const course = await db_1.default.course.findUnique({ where: { id } });
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        await db_1.default.$transaction([
            db_1.default.grade.deleteMany({ where: { submission: { assignment: { courseId: id } } } }),
            db_1.default.submission.deleteMany({ where: { assignment: { courseId: id } } }),
            db_1.default.assignment.deleteMany({ where: { courseId: id } }),
            db_1.default.quizResult.deleteMany({ where: { quiz: { courseId: id } } }),
            db_1.default.question.deleteMany({ where: { quiz: { courseId: id } } }),
            db_1.default.quiz.deleteMany({ where: { courseId: id } }),
            db_1.default.progress.deleteMany({ where: { enrollment: { courseId: id } } }),
            db_1.default.enrollment.deleteMany({ where: { courseId: id } }),
            db_1.default.courseContent.deleteMany({ where: { module: { courseId: id } } }),
            db_1.default.courseModule.deleteMany({ where: { courseId: id } }),
            db_1.default.course.delete({ where: { id } }),
        ]);
        res.json({ message: 'Cours supprimé' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du cours' });
    }
};
exports.deleteCourse = deleteCourse;
const getCourseEnrollments = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const course = await db_1.default.course.findUnique({ where: { id } });
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        const enrollments = await db_1.default.enrollment.findMany({
            where: { courseId: id },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
            orderBy: { id: 'desc' }
        });
        res.json(enrollments);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions du cours' });
    }
};
exports.getCourseEnrollments = getCourseEnrollments;
const removeCourseEnrollment = async (req, res) => {
    try {
        const { id, enrollmentId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const course = await db_1.default.course.findUnique({ where: { id } });
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        const enrollment = await db_1.default.enrollment.findUnique({ where: { id: enrollmentId } });
        if (!enrollment || enrollment.courseId !== id) {
            return res.status(404).json({ message: 'Inscription non trouvée' });
        }
        await db_1.default.enrollment.delete({ where: { id: enrollmentId } });
        res.json({ message: 'Étudiant retiré du cours' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'inscription' });
    }
};
exports.removeCourseEnrollment = removeCourseEnrollment;
const addCourseEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: targetUserId } = req.body;
        const userId = req.user.id;
        const role = req.user.role;
        const course = await db_1.default.course.findUnique({ where: { id } });
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        const targetUser = await db_1.default.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        if (targetUser.role !== 'STUDENT')
            return res.status(400).json({ message: 'Seuls les étudiants peuvent être inscrits' });
        const enrollment = await db_1.default.enrollment.create({
            data: { userId: targetUserId, courseId: id },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } }
        });
        await (0, notificationController_1.createNotification)(targetUserId, 'Inscription par enseignant', `Vous avez été inscrit au cours "${course.title}".`, 'INFO');
        res.status(201).json(enrollment);
    }
    catch (error) {
        res.status(400).json({ message: 'Déjà inscrit ou erreur lors de l\'inscription' });
    }
};
exports.addCourseEnrollment = addCourseEnrollment;
const enrollInCourse = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;
    try {
        const enrollment = await db_1.default.enrollment.create({
            data: { userId, courseId },
            include: { course: { select: { title: true } } }
        });
        // Notification
        await (0, notificationController_1.createNotification)(userId, 'Inscription réussie', `Vous êtes maintenant inscrit au cours "${enrollment.course.title}".`, 'SUCCESS');
        res.status(201).json({ message: 'Inscription réussie', enrollment });
    }
    catch (error) {
        res.status(400).json({ message: 'Déjà inscrit ou erreur lors de l\'inscription' });
    }
};
exports.enrollInCourse = enrollInCourse;
const getAllEnrollments = async (_req, res) => {
    try {
        const enrollments = await db_1.default.enrollment.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                course: { select: { title: true } }
            }
        });
        res.json(enrollments);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions' });
    }
};
exports.getAllEnrollments = getAllEnrollments;
const deleteEnrollment = async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.enrollment.delete({ where: { id } });
        res.json({ message: 'Inscription supprimée' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'inscription' });
    }
};
exports.deleteEnrollment = deleteEnrollment;
const addModule = async (req, res) => {
    const { title, courseId } = req.body;
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const course = await db_1.default.course.findUnique({ where: { id: courseId } });
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        const module = await db_1.default.courseModule.create({
            data: { title, courseId }
        });
        res.status(201).json(module);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du module' });
    }
};
exports.addModule = addModule;
const addContent = async (req, res) => {
    const { title, type, moduleId } = req.body;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const module = await db_1.default.courseModule.findUnique({
            where: { id: moduleId },
            include: { course: true }
        });
        if (!module)
            return res.status(404).json({ message: 'Module non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && module.course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        const subDir = type === 'VIDEO' ? 'videos' : 'pdfs';
        const url = `/uploads/${subDir}/${file.filename}`;
        const content = await db_1.default.courseContent.create({
            data: { title, type, url, moduleId },
            include: { module: { include: { course: { select: { id: true, title: true } } } } }
        });
        // Notifier les étudiants
        const enrollments = await db_1.default.enrollment.findMany({
            where: { courseId: content.module.course.id },
            select: { userId: true }
        });
        for (const enrollment of enrollments) {
            await (0, notificationController_1.createNotification)(enrollment.userId, 'Nouveau contenu', `Une nouvelle leçon "${title}" a été ajoutée au cours "${content.module.course.title}".`, 'INFO');
        }
        res.status(201).json(content);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du contenu' });
    }
};
exports.addContent = addContent;
const deleteContent = async (req, res) => {
    const { id } = req.params;
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const content = await db_1.default.courseContent.findUnique({
            where: { id },
            include: { module: { include: { course: true } } }
        });
        if (!content)
            return res.status(404).json({ message: 'Contenu non trouvé' });
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && content.module.course.teacherId !== userId) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        await db_1.default.courseContent.delete({ where: { id } });
        res.json({ message: 'Contenu supprimé' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du contenu' });
    }
};
exports.deleteContent = deleteContent;
const getCourseDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;
    try {
        const course = await db_1.default.course.findUnique({
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
        if (!course)
            return res.status(404).json({ message: 'Cours non trouvé' });
        // Vérifier si l'utilisateur est inscrit
        let isEnrolled = false;
        if (userId) {
            const enrollment = await db_1.default.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId: id } }
            });
            isEnrolled = !!enrollment;
        }
        const canAccessFullContent = role === 'ADMIN' ||
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
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du cours' });
    }
};
exports.getCourseDetails = getCourseDetails;
