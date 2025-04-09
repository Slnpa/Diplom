import { Request, Response } from 'express';
import prisma from '../db'; // Подключаем prisma клиент
import { hash } from 'bcrypt';

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

// Создание бронирования от имени внешнего (незарегистрированного) пользователя
export const bookForExternalUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, propertyId, startDate, endDate } = req.body;

  if (!name || !email || !propertyId || !startDate || !endDate) {
    res.status(400).json({ message: 'Необходимо заполнить все поля' });
    return;
  }

  try {
    let externalUser = await prisma.user.findFirst({
      where: {
        email,
        isExternal: true,
      },
    });

    if (!externalUser) {
      const fakePassword = await hash(Math.random().toString(36).slice(-8), 10);
      externalUser = await prisma.user.create({
        data: {
          login: name,
          email,
          role: 'USER',
          isExternal: true,
          password: fakePassword,
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'CONFIRMED',
        userId: externalUser.id,
        propertyId: Number(propertyId),
      },
    });

    res.status(201).json({ message: 'Бронирование успешно создано', booking });
  } catch (error) {
    console.error('Ошибка бронирования:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};
