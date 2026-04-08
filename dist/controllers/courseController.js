"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseDetails = exports.addContent = exports.addModule = exports.deleteEnrollment = exports.getAllEnrollments = exports.enrollInCourse = exports.getTeacherCourses = exports.getAllCourses = exports.createCourse = exports.getEnrolledCourses = void 0;
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
    const { title, description, price } = req.body;
    const teacherId = req.user.id;
    try {
        const course = await db_1.default.course.create({
            data: { title, description, price: parseFloat(price), teacherId }
        });
        res.status(201).json(course);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du cours' });
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
        const courses = await db_1.default.course.findMany({
            where,
            include: {
                teacher: { select: { firstName: true, lastName: true } },
                _count: { select: { enrollments: true } }
            }
        });
        res.json(courses);
    }
    catch (error) {
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
                _count: { select: { enrollments: true } }
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
                quizzes: true
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
