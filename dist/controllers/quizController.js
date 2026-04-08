"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuiz = exports.deleteQuiz = exports.submitQuiz = exports.getTeacherQuizzes = exports.getStudentQuizzes = exports.getQuizById = exports.getQuizzesByCourse = exports.createQuiz = void 0;
const db_1 = __importDefault(require("../config/db"));
// Créer un quiz
const createQuiz = async (req, res) => {
    try {
        const { title, courseId, questions } = req.body;
        const quiz = await db_1.default.quiz.create({
            data: {
                title,
                courseId,
                questions: {
                    create: questions.map((q) => ({
                        text: q.text,
                        options: JSON.stringify(q.options), // Stocker les options comme une chaîne JSON
                        answer: q.answer,
                    })),
                },
            },
            include: { questions: true },
        });
        res.status(201).json(quiz);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création du quiz' });
    }
};
exports.createQuiz = createQuiz;
// Obtenir tous les quiz d'un cours
const getQuizzesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const quizzes = await db_1.default.quiz.findMany({
            where: { courseId },
            include: { questions: true },
        });
        res.json(quizzes);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des quiz' });
    }
};
exports.getQuizzesByCourse = getQuizzesByCourse;
// Obtenir un quiz par ID
const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await db_1.default.quiz.findUnique({
            where: { id },
            include: { questions: true },
        });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz non trouvé' });
        }
        res.json(quiz);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération du quiz' });
    }
};
exports.getQuizById = getQuizById;
// Obtenir les quiz disponibles pour un étudiant (uniquement ses cours)
const getStudentQuizzes = async (req, res) => {
    try {
        const userId = req.user.id;
        const quizzes = await db_1.default.quiz.findMany({
            where: {
                course: {
                    enrollments: {
                        some: { userId }
                    }
                }
            },
            include: {
                course: { select: { id: true, title: true } },
                results: {
                    where: { userId }
                }
            },
            orderBy: { title: 'asc' }
        });
        res.json(quizzes.map(q => ({
            id: q.id,
            title: q.title,
            course: q.course,
            bestScore: q.results[0]?.score ?? null,
            attemptsUsed: q.results.length,
        })));
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des quiz étudiant' });
    }
};
exports.getStudentQuizzes = getStudentQuizzes;
const getTeacherQuizzes = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const quizzes = await db_1.default.quiz.findMany({
            where: {
                course: { teacherId }
            },
            include: {
                course: { select: { id: true, title: true } },
                questions: { select: { id: true } },
                results: { select: { score: true } }
            },
            orderBy: { title: 'asc' }
        });
        const mapped = quizzes.map(q => {
            const participants = q.results.length;
            const avgScore = participants > 0 ? q.results.reduce((acc, r) => acc + r.score, 0) / participants : null;
            return {
                id: q.id,
                title: q.title,
                course: q.course,
                questionsCount: q.questions.length,
                participants,
                avgScore
            };
        });
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des quiz enseignant' });
    }
};
exports.getTeacherQuizzes = getTeacherQuizzes;
// Soumettre un quiz et calculer le score
const submitQuiz = async (req, res) => {
    try {
        const { quizId, answers } = req.body; // answers: [{ questionId: string, selectedOption: string }]
        const userId = req.user.id;
        const quiz = await db_1.default.quiz.findUnique({
            where: { id: quizId },
            include: { questions: true },
        });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz non trouvé' });
        }
        let score = 0;
        const results = quiz.questions.map(question => {
            const userAnswer = answers.find((a) => a.questionId === question.id);
            const isCorrect = userAnswer?.selectedOption === question.answer;
            if (isCorrect) {
                score++;
            }
            return {
                questionId: question.id,
                isCorrect,
                correctAnswer: question.answer,
                userAnswer: userAnswer?.selectedOption || null,
            };
        });
        // Enregistrer ou mettre à jour le résultat du quiz
        const finalScore = (score / quiz.questions.length) * 100;
        const quizResult = await db_1.default.quizResult.upsert({
            where: {
                userId_quizId: {
                    userId,
                    quizId,
                },
            },
            update: {
                score: finalScore,
                createdAt: new Date(),
            },
            create: {
                userId,
                quizId,
                score: finalScore,
            },
        });
        res.json({
            score,
            totalQuestions: quiz.questions.length,
            percentage: finalScore,
            results,
            quizResult
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la soumission du quiz' });
    }
};
exports.submitQuiz = submitQuiz;
const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.question.deleteMany({ where: { quizId: id } });
        await db_1.default.quiz.delete({ where: { id } });
        res.json({ message: 'Quiz supprimé avec succès' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du quiz' });
    }
};
exports.deleteQuiz = deleteQuiz;
const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        const { title, questions } = req.body;
        const quiz = await db_1.default.quiz.findUnique({
            where: { id },
            include: { course: true }
        });
        if (!quiz)
            return res.status(404).json({ message: 'Quiz non trouvé' });
        if (quiz.course.teacherId !== teacherId)
            return res.status(403).json({ message: 'Accès interdit' });
        const updated = await db_1.default.quiz.update({
            where: { id },
            data: { title }
        });
        await db_1.default.question.deleteMany({ where: { quizId: id } });
        await db_1.default.question.createMany({
            data: (questions || []).map((q) => ({
                text: q.text,
                options: JSON.stringify(q.options || []),
                answer: q.answer,
                quizId: id
            }))
        });
        const full = await db_1.default.quiz.findUnique({
            where: { id },
            include: { questions: true }
        });
        res.json(full || updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du quiz' });
    }
};
exports.updateQuiz = updateQuiz;
