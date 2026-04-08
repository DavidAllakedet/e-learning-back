"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuiz = exports.submitQuiz = exports.getStudentQuizzes = exports.getQuizById = exports.getQuizzesByCourse = exports.createQuiz = void 0;
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
