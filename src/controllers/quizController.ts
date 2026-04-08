// d:\PROJETS\COURS REACT\e-l\backend\src\controllers\quizController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';

// Créer un quiz
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { title, courseId, questions } = req.body;
    const quiz = await prisma.quiz.create({
      data: {
        title,
        courseId,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            options: JSON.stringify(q.options), // Stocker les options comme une chaîne JSON
            answer: q.answer,
          })),
        },
      },
      include: { questions: true },
    });
    res.status(201).json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du quiz' });
  }
};

// Obtenir tous les quiz d'un cours
export const getQuizzesByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      include: { questions: true },
    });
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des quiz' });
  }
};

// Obtenir un quiz par ID
export const getQuizById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }
    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du quiz' });
  }
};

// Obtenir les quiz disponibles pour un étudiant (uniquement ses cours)
export const getStudentQuizzes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const quizzes = await prisma.quiz.findMany({
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

    res.json(
      quizzes.map(q => ({
        id: q.id,
        title: q.title,
        course: q.course,
        bestScore: q.results[0]?.score ?? null,
        attemptsUsed: q.results.length,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des quiz étudiant' });
  }
};

// Soumettre un quiz et calculer le score
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId, answers } = req.body; // answers: [{ questionId: string, selectedOption: string }]
    const userId = (req as any).user.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    let score = 0;
    const results = quiz.questions.map(question => {
      const userAnswer = answers.find((a: any) => a.questionId === question.id);
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

    const quizResult = await prisma.quizResult.upsert({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la soumission du quiz' });
  }
};

export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.question.deleteMany({ where: { quizId: id } });
    await prisma.quiz.delete({ where: { id } });
    res.json({ message: 'Quiz supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du quiz' });
  }
};
