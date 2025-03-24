import { Request, Response } from 'express';
import prisma from '../db'; // Подключаем prisma клиент

export const getOwnerStatistics = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params; 

  try {
    // Получаем статистику по жилью
    const housingCount = await prisma.property.count({
      where: {
        ownerId: Number(userId),
      },
    });
    // Получаем статистику по бронированиям
    const bookingsCount = await prisma.booking.count({
      where: {
        property: {
          ownerId: Number(userId),
        },
      },
    });

    // Получаем статистику по статусам бронирований
    const completedBookingsCount = await prisma.booking.count({
      where: {
        property: {
          ownerId: Number(userId),
        },
        status: 'CONFIRMED',
      },
    });

    // Отправляем статистику владельцу
    res.status(200).json({
      housingCount,
      bookingsCount,
      completedBookingsCount,
    });
  } catch (error) {
    console.error('Ошибка при получении статистики владельца:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении статистики', error });
  }
};
