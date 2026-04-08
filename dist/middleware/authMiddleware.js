"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(403).json({ message: 'Permissions insuffisantes pour cette action' });
        }
        if (user.role === 'SUPER_ADMIN') {
            return next();
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: 'Permissions insuffisantes pour cette action' });
        }
        next();
    };
};
exports.authorize = authorize;
