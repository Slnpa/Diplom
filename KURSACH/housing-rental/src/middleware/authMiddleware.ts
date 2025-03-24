import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../db';

const SECRET_KEY = 'pahapodoben';

interface UserPayload {
  id: number;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization']?.split(' ')[1]; // Извлекаем токен из заголовков
  
  if (!token) {
    res.status(401).json({ message: 'Токен не предоставлен' });
    return;
  }

  try {
    // Проверяем и расшифровываем токен
    const decoded = jwt.verify(token, SECRET_KEY) as UserPayload;
    (req as any).user = decoded; // Сохраняем информацию о пользователе в запросе
    next();
  } catch (error) {
    console.error('Ошибка при расшифровке токена:', error); // Лог ошибки
    res.status(401).json({ message: 'Неверный или просроченный токен' });
    return;
  }
};