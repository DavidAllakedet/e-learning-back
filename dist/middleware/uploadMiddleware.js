"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.upload = void 0;
// d:\PROJETS\COURS REACT\e-l\backend\src\middleware\uploadMiddleware.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// S'assurer que les dossiers d'upload existent
const baseDir = 'uploads';
const dirs = ['videos', 'pdfs', 'avatars', 'others'];
if (!fs_1.default.existsSync(baseDir)) {
    fs_1.default.mkdirSync(baseDir);
}
dirs.forEach(dir => {
    const fullPath = path_1.default.join(baseDir, dir);
    if (!fs_1.default.existsSync(fullPath)) {
        fs_1.default.mkdirSync(fullPath);
    }
});
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let subDir = 'others';
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (['.mp4', '.mov', '.webm', '.m4v'].includes(ext))
            subDir = 'videos';
        else if (ext === '.pdf')
            subDir = 'pdfs';
        cb(null, path_1.default.join(baseDir, subDir));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.mp4', '.mov', '.webm', '.m4v'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('Seuls les fichiers PDF et vidéos (MP4, MOV, WEBM) sont autorisés.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // Limite à 100MB pour les vidéos
});
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.join(baseDir, 'avatars'));
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const avatarFileFilter = (_req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('Seuls les fichiers PNG, JPG, JPEG et WEBP sont autorisés.'));
    }
};
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
