"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAsRead = exports.getNotifications = void 0;
const db_1 = __importDefault(require("../config/db"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await db_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await db_1.default.notification.updateMany({
            where: { id, userId },
            data: { read: true }
        });
        res.json({ message: 'Notification marquée comme lue' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};
exports.markAsRead = markAsRead;
const createNotification = async (userId, title, message, type = 'INFO') => {
    try {
        return await db_1.default.notification.create({
            data: { userId, title, message, type }
        });
    }
    catch (error) {
        console.error('Erreur lors de la création de la notification', error);
    }
};
exports.createNotification = createNotification;
