"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.adminExportEnrollmentsCsv = exports.adminExportUsersCsv = exports.searchUsers = exports.adminStats = exports.adminDeleteUser = exports.adminUpdateUser = exports.adminListUsers = exports.updateProfile = exports.getProfile = void 0;
const db_1 = __importDefault(require("../config/db"));
const getProfile = async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, university: true, className: true, interests: true, institution: true, specialty: true, bio: true, createdAt: true }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const { firstName, lastName, password, avatar, university, className, interests, institution, specialty, bio } = req.body;
    try {
        const data = { firstName, lastName, avatar, university, className, interests, institution, specialty, bio };
        if (password) {
            const bcrypt = require('bcryptjs');
            data.password = await bcrypt.hash(password, 10);
        }
        const user = await db_1.default.user.update({
            where: { id: req.user.id },
            data
        });
        res.json({ message: 'Profil mis à jour', user: { firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};
exports.updateProfile = updateProfile;
const adminListUsers = async (_req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
};
exports.adminListUsers = adminListUsers;
const adminUpdateUser = async (req, res) => {
    const { id } = req.params;
    const { email, firstName, lastName, role, password } = req.body;
    try {
        const data = { email, firstName, lastName, role };
        if (password) {
            const bcrypt = require('bcryptjs');
            data.password = await bcrypt.hash(password, 10);
        }
        const user = await db_1.default.user.update({
            where: { id },
            data,
            select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour utilisateur' });
    }
};
exports.adminUpdateUser = adminUpdateUser;
const adminDeleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.user.delete({ where: { id } });
        res.json({ message: 'Utilisateur supprimé' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression utilisateur' });
    }
};
exports.adminDeleteUser = adminDeleteUser;
const adminStats = async (_req, res) => {
    try {
        const [users, courses, enrollments, assignments] = await Promise.all([
            db_1.default.user.count(),
            db_1.default.course.count(),
            db_1.default.enrollment.count(),
            db_1.default.assignment.count(),
        ]);
        res.json({ users, courses, enrollments, assignments });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};
exports.adminStats = adminStats;
const searchUsers = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const requesterRole = req.user.role;
        const roleFilter = String(req.query.role || '').trim();
        const where = {};
        if (q) {
            where.OR = [
                { email: { contains: q } },
                { firstName: { contains: q } },
                { lastName: { contains: q } },
            ];
        }
        if (requesterRole === 'TEACHER') {
            where.role = 'STUDENT';
        }
        else if (roleFilter) {
            where.role = roleFilter;
        }
        const users = await db_1.default.user.findMany({
            where,
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la recherche utilisateurs' });
    }
};
exports.searchUsers = searchUsers;
const escapeCsv = (value) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str))
        return `"${str.replace(/"/g, '""')}"`;
    return str;
};
const adminExportUsersCsv = async (_req, res) => {
    try {
        const users = await db_1.default.user.findMany({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'export CSV' });
    }
};
exports.adminExportUsersCsv = adminExportUsersCsv;
const adminExportEnrollmentsCsv = async (_req, res) => {
    try {
        const enrollments = await db_1.default.enrollment.findMany({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'export CSV' });
    }
};
exports.adminExportEnrollmentsCsv = adminExportEnrollmentsCsv;
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;
        if (!file)
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        const avatar = `/uploads/avatars/${file.filename}`;
        const user = await db_1.default.user.update({
            where: { id: userId },
            data: { avatar },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true }
        });
        res.json({ message: 'Avatar mis à jour', user });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'avatar' });
    }
};
exports.uploadAvatar = uploadAvatar;
