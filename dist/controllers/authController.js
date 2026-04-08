"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const generateToken = (id, role) => {
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = (process.env.JWT_EXPIRE || '30d');
    return jsonwebtoken_1.default.sign({ id, role }, secret, {
        expiresIn: expiresIn,
    });
};
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, avatar, university, className, interests, institution, specialty, bio } = req.body;
        const userExists = await db_1.default.user.findUnique({ where: { email } });
        if (userExists)
            return res.status(400).json({ message: 'Utilisateur déjà inscrit' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.default.user.create({
            data: { email, password: hashedPassword, firstName, lastName, role: role || 'STUDENT', avatar, university, className, interests, institution, specialty, bio },
        });
        res.status(201).json({
            token: generateToken(user.id, user.role),
            user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'inscription', error });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        res.json({
            token: generateToken(user.id, user.role),
            user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la connexion', error });
    }
};
exports.login = login;
