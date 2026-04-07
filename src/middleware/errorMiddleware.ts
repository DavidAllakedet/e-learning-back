// d:\PROJETS\COURS REACT\e-l\backend\src\middleware\errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  
  console.error(`[Error] ${err.message}`);
  if (err.stack) console.error(err.stack);

  res.status(statusCode).json({
    message: err.message || 'Erreur interne du serveur',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};