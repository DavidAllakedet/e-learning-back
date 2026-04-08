"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStats = exports.adminDeleteUser = exports.adminUpdateUser = exports.adminListUsers = exports.updateProfile = exports.getProfile = void 0;
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
