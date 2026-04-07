// d:\PROJETS\COURS REACT\e-l\backend\src\middleware\uploadMiddleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// S'assurer que les dossiers d'upload existent
const baseDir = 'uploads';
const dirs = ['videos', 'pdfs', 'others'];

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'others';
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext === '.mp4') subDir = 'videos';
    else if (ext === '.pdf') subDir = 'pdfs';
    
    cb(null, path.join(baseDir, subDir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.pdf', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers MP4 et PDF sont autorisés.'));
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // Limite à 100MB pour les vidéos
});