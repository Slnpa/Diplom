import { Request, Response } from 'express';
import prisma from '../db';

// Обновить роль пользователя
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { newRole } = req.body;

  try {
    // Проверяем, что роль новая корректная
    if (!['USER', 'OWNER'].includes(newRole)) {
      res.status(400).json({ message: 'Неверная роль' });
      return;
    }

    // Обновляем роль в базе данных
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: newRole }, // Роль будет изменена на 'USER' или 'OWNER'
    });

    res.status(200).json({ message: 'Роль обновлена', updatedUser });
  } catch (error) {
    console.error('Ошибка при обновлении роли:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении роли' });
  }
};
