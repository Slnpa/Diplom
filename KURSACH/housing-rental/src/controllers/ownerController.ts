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
  const { name, propertyId, startDate, endDate, userId } = req.body;
  const authenticatedUserId = userId; // Получаем ID из токена

  // Проверка обязательных полей
  if (!name || !propertyId || !startDate || !endDate || !userId) {
    res.status(400).json({ message: 'Необходимо заполнить все поля' });
    return;
  }

  if (!authenticatedUserId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }

  // Проверяем, что userId из тела запроса совпадает с аутентифицированным пользователем
  if (Number(userId) !== Number(authenticatedUserId)) {
    res.status(403).json({ message: 'Недостаточно прав для создания бронирования от имени другого пользователя' });
    return;
  }

  try {
    // Проверяем, что пользователь является владельцем объекта недвижимости
    const property = await prisma.property.findFirst({
      where: {
        id: Number(propertyId),
        ownerId: Number(userId), // Используем userId (замените на ownerId, если нужно)
      },
    });

    if (!property) {
      res.status(403).json({ message: 'Вы не являетесь владельцем этого объекта' });
      return;
    }

    // Проверяем, что даты свободны
    const existingBookings = await prisma.booking.findMany({
      where: {
        propertyId: Number(propertyId),
        status: 'CONFIRMED',
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      res.status(400).json({ message: 'Выбранные даты уже заняты' });
      return;
    }

    // Создаём бронирование, привязанное к владельцу
    const booking = await prisma.booking.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'CONFIRMED',
        userId: Number(userId),
        propertyId: Number(propertyId),
        clientName: name, // Сохраняем имя клиента
      },
    });

    res.status(201).json({ message: 'Бронирование успешно создано', booking });
  } catch (error) {
    console.error('Ошибка бронирования:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};
