"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAssignment = exports.updateAssignment = exports.getTeacherAssignments = exports.gradeSubmission = exports.submitAssignment = exports.getStudentAssignments = exports.getSubmissionsByTeacher = exports.getAssignmentById = exports.createAssignment = void 0;
const db_1 = __importDefault(require("../config/db"));
const path_1 = __importDefault(require("path"));
const notificationController_1 = require("./notificationController");
// Créer un devoir (Enseignant/Admin)
const createAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, courseId } = req.body;
        const file = req.file;
        const assignment = await db_1.default.assignment.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                courseId,
            },
        });
        // Notifier les étudiants inscrits
        const enrollments = await db_1.default.enrollment.findMany({
            where: { courseId },
            select: { userId: true }
        });
        for (const enrollment of enrollments) {
            await (0, notificationController_1.createNotification)(enrollment.userId, 'Nouveau devoir', `Un nouveau devoir "${title}" a été ajouté.`, 'INFO');
        }
        res.status(201).json(assignment);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du devoir' });
    }
};
exports.createAssignment = createAssignment;
// Obtenir un devoir par ID
const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const assignment = await db_1.default.assignment.findUnique({
            where: { id },
            include: {
                course: { select: { title: true } },
                submissions: {
                    where: { userId },
                    include: { grade: true }
                }
            }
        });
        if (!assignment)
            return res.status(404).json({ message: 'Devoir non trouvé' });
        const submission = assignment.submissions[0];
        let status = 'pending';
        if (submission) {
            status = submission.grade ? 'graded' : 'submitted';
        }
        res.json({
            ...assignment,
            courseTitle: assignment.course.title,
            status,
            submission,
            grade: submission?.grade
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du devoir' });
    }
};
exports.getAssignmentById = getAssignmentById;
// Obtenir les soumissions pour un enseignant
const getSubmissionsByTeacher = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const submissions = await db_1.default.submission.findMany({
            where: {
                assignment: { course: { teacherId } }
            },
            include: {
                user: { select: { firstName: true, lastName: true } },
                assignment: { select: { title: true } },
                grade: true
            },
            orderBy: { submittedAt: 'desc' }
        });
        res.json(submissions);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des soumissions' });
    }
};
exports.getSubmissionsByTeacher = getSubmissionsByTeacher;
// Obtenir les devoirs d'un étudiant (uniquement ses cours)
const getStudentAssignments = async (req, res) => {
    try {
        const userId = req.user.id;
        const assignments = await db_1.default.assignment.findMany({
            where: {
                course: {
                    enrollments: {
                        some: { userId }
                    }
                }
            },
            include: {
                course: { select: { id: true, title: true } },
                submissions: {
                    where: { userId },
                    include: { grade: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
        const mapped = assignments.map(a => {
            const submission = a.submissions[0];
            let status = 'pending';
            if (submission)
                status = submission.grade ? 'graded' : 'submitted';
            return {
                id: a.id,
                title: a.title,
                description: a.description,
                dueDate: a.dueDate,
                course: a.course,
                status,
                submission,
                grade: submission?.grade || null
            };
        });
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des devoirs' });
    }
};
exports.getStudentAssignments = getStudentAssignments;
// Soumettre un devoir (Étudiant)
const submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const userId = req.user.id;
        const file = req.file;
        if (!file)
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const subDir = ext === '.mp4' ? 'videos' : ext === '.pdf' ? 'pdfs' : 'others';
        const submission = await db_1.default.submission.create({
            data: {
                fileUrl: `/uploads/${subDir}/${file.filename}`,
                userId,
                assignmentId,
            },
        });
        res.status(201).json(submission);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la soumission' });
    }
};
exports.submitAssignment = submitAssignment;
// Noter une soumission (Enseignant/Admin)
const gradeSubmission = async (req, res) => {
    try {
        const { submissionId, value, feedback } = req.body;
        const teacherId = req.user.id;
        const grade = await db_1.default.grade.create({
            data: {
                value: parseFloat(value),
                feedback,
                submissionId,
                teacherId,
            },
            include: {
                submission: {
                    select: { userId: true, assignment: { select: { title: true } } }
                }
            }
        });
        // Notifier l'étudiant
        await (0, notificationController_1.createNotification)(grade.submission.userId, 'Note reçue', `Votre devoir "${grade.submission.assignment.title}" a été noté.`, 'SUCCESS');
        res.status(201).json(grade);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la notation' });
    }
};
exports.gradeSubmission = gradeSubmission;
// Obtenir tous les devoirs d'un enseignant
const getTeacherAssignments = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const assignments = await db_1.default.assignment.findMany({
            where: {
                course: { teacherId }
            },
            include: {
                course: { select: { id: true, title: true } }
            },
            orderBy: { dueDate: 'asc' }
        });
        res.json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des devoirs' });
    }
};
exports.getTeacherAssignments = getTeacherAssignments;
// Mettre à jour un devoir
const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        const { title, description, dueDate } = req.body;
        const assignment = await db_1.default.assignment.findUnique({
            where: { id },
            include: { course: true }
        });
        if (!assignment)
            return res.status(404).json({ message: 'Devoir non trouvé' });
        if (assignment.course.teacherId !== teacherId)
            return res.status(403).json({ message: 'Accès interdit' });
        const updated = await db_1.default.assignment.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(dueDate && { dueDate: new Date(dueDate) })
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};
exports.updateAssignment = updateAssignment;
// Supprimer un devoir
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        const assignment = await db_1.default.assignment.findUnique({
            where: { id },
            include: { course: true }
        });
        if (!assignment)
            return res.status(404).json({ message: 'Devoir non trouvé' });
        if (assignment.course.teacherId !== teacherId)
            return res.status(403).json({ message: 'Accès interdit' });
        await db_1.default.submission.deleteMany({ where: { assignmentId: id } });
        await db_1.default.assignment.delete({ where: { id } });
        res.json({ message: 'Devoir supprimé' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};
exports.deleteAssignment = deleteAssignment;
