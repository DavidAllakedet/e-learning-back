"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseProgress = exports.updateProgress = void 0;
const db_1 = __importDefault(require("../config/db"));
const updateProgress = async (req, res) => {
    try {
        const { courseContentId, completed } = req.body;
        const userId = req.user.id;
        // Trouver l'inscription correspondante pour obtenir l'enrollmentId
        const content = await db_1.default.courseContent.findUnique({
            where: { id: courseContentId },
            include: { module: true }
        });
        if (!content) {
            return res.status(404).json({ message: 'Contenu non trouvé' });
        }
        const enrollment = await db_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: content.module.courseId
                }
            }
        });
        if (!enrollment) {
            return res.status(403).json({ message: 'Vous n\'êtes pas inscrit à ce cours' });
        }
        const progress = await db_1.default.progress.upsert({
            where: {
                userId_courseContentId: {
                    userId,
                    courseContentId
                }
            },
            update: { completed },
            create: {
                userId,
                courseContentId,
                completed,
                enrollmentId: enrollment.id
            }
        });
        res.json(progress);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la progression' });
    }
};
exports.updateProgress = updateProgress;
const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const enrollment = await db_1.default.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            },
            include: {
                progress: true,
                course: {
                    include: {
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
                }
            }
        });
        if (!enrollment) {
            return res.status(404).json({ message: 'Inscription non trouvée' });
        }
        // Calculer le total des contenus et quiz
        const totalContents = enrollment.course.modules.reduce((acc, mod) => acc + mod.contents.length, 0);
        const totalQuizzes = enrollment.course.quizzes.length;
        const totalItems = totalContents + totalQuizzes;
        // Calculer les éléments complétés
        const completedContents = enrollment.progress.filter(p => p.completed).length;
        const completedQuizzes = enrollment.course.quizzes.filter(q => q.results.length > 0).length;
        const completedItems = completedContents + completedQuizzes;
        const percentage = totalItems > 0
            ? Math.round((completedItems / totalItems) * 100)
            : 0;
        res.json({
            percentage,
            completedCount: completedItems,
            totalCount: totalItems,
            completedContentIds: enrollment.progress.filter(p => p.completed).map(p => p.courseContentId),
            completedQuizIds: enrollment.course.quizzes.filter(q => q.results.length > 0).map(q => q.id)
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la progression' });
    }
};
exports.getCourseProgress = getCourseProgress;
