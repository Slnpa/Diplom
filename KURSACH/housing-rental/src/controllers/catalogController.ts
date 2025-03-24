import { Request, Response } from 'express';
import prisma from '../db';

export const deleteHousing = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = (req as any).user; // Предполагается, что `user` уже добавлен в объект `req` через middleware (например, для авторизации)
  if (!user) {
    res.status(401).json({ message: 'Необходимо авторизоваться' });
    return;
  }

  try {
    const propertyId = parseInt(id);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        bookings: true, // Проверка связанных бронирований
        criteria: true, // Проверка связанных критериев
        chats: {
          include: {
            messages: true, // Учитываем связанные сообщения
          },
        },
        reviews: true, // Проверка связанных отзывов
      },
    });

    if (!property) {
      res.status(404).json({ message: 'Жилье не найдено' });
      return;
    }

    // Проверяем, является ли пользователь владельцем или администратором
    if (user.role !== 'ADMIN' && property.ownerId !== user.userId) {
      res.status(403).json({ message: 'У вас нет прав для удаления этого жилья' });
      return;
    }

    // Удаляем связанные бронирования
    await prisma.booking.deleteMany({
      where: {
        propertyId: propertyId,
      },
    });

    // Удаляем связи с критериями
    await prisma.propertyCriterion.deleteMany({
      where: {
        propertyId: propertyId,
      },
    });

    // Удаляем связанные отзывы
    await prisma.review.deleteMany({
      where: {
        propertyId: propertyId,
      },
    });

    // Удаляем связанные сообщения чатов
    for (const chat of property.chats) {
      await prisma.message.deleteMany({
        where: {
          chatId: chat.id,
        },
      });
    }

    // Удаляем связанные чаты
    await prisma.chat.deleteMany({
      where: {
        propertyId: propertyId,
      },
    });

    // Удаляем само жилье
    await prisma.property.delete({
      where: { id: propertyId },
    });

    res.status(200).json({ message: 'Жилье и все связанные данные успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении жилья:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении жилья', error });
  }
};


export const createHousing = async (req: Request, res: Response): Promise<void> => {
  const { name, description, location, pricePerNight, ownerId, categoryId, criteria } = req.body;
  const imageUrl = req.file ? `/images/${req.file.filename}` : null;

  // Проверка обязательных полей
  if (!name || !description || !location || !pricePerNight || !ownerId || !categoryId) {
    res.status(400).json({ message: 'Все поля, кроме изображения, обязательны' });
    return;
  }

  try {
    // Создание нового жилья
    const newProperty = await prisma.property.create({
      data: {
        name,
        description,
        location,
        pricePerNight: parseFloat(pricePerNight), // Убедитесь, что это число
        owner: {
          connect: { id: parseInt(ownerId) }, // Связь с владельцем
        },
        category: {
          connect: { id: parseInt(categoryId) }, // Связь с категорией
        },
        imageUrl,
      },
    });

    // Если переданы критерии, связываем их с жильем через промежуточную таблицу
    if (criteria && criteria.length > 0) {
      const criterionConnections = criteria.map((criterionId: string) => ({
        propertyId: newProperty.id, // Связь с Property
        criterionId: parseInt(criterionId), // Связь с Criterion
      }));

      // Создаем связи с критериями
      await prisma.propertyCriterion.createMany({
        data: criterionConnections, // Добавляем связи в промежуточную таблицу
      });
    }

    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Ошибка при создании жилья:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании жилья', error });
  }
};

// Получение всех доступных объектов жилья
export const getCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    // Получаем userId и userRole из query-параметров
    const userId = parseInt(req.query.userId as string); // Получаем userId из query
    const userRole = req.query.userRole as string; // Получаем userRole из query
    // Если роль OWNER, фильтруем жилье по ownerId
    const housing = userRole === 'OWNER' && userId
      ? await prisma.property.findMany({
          where: {
            ownerId: userId, // Фильтруем по ownerId
          },
          include: {
            owner: {
              select: { login: true, email: true, id: true },
            },
            bookings: {
              select: { startDate: true, endDate: true, status: true },
            },
            category: true, // Добавляем информацию о категории жилья
          },
        })
      : userRole !== 'OWNER' && userRole !== 'ADMIN' && userId
      ? await prisma.property.findMany({
          where: {
            ownerId: {
              not: userId, // Фильтруем по ownerId, исключая текущего пользователя
            },
          },
          include: {
            owner: {
              select: { login: true, email: true, id: true },
            },
            bookings: {
              select: { startDate: true, endDate: true, status: true },
            },
            category: true, // Добавляем информацию о категории жилья
          },
        })
        : userRole === 'ADMIN' && userId
      ? await prisma.property.findMany({
          include: {
            owner: {
              select: { login: true, email: true, id: true },
            },
            bookings: {
              select: { startDate: true, endDate: true, status: true },
            },
            category: true, // Добавляем информацию о категории жилья
          },
        })
      : await prisma.property.findMany({
          include: {
            owner: {
              select: { login: true, email: true, id: true },
            },
            bookings: {
              select: { startDate: true, endDate: true, status: true },
            },
            category: true, // Добавляем информацию о категории жилья
          },
        });

    // Если жилье не найдено
    if (housing.length === 0) {
      res.status(404).json({ message: 'Жилье не найдено' });
      return;
    }

    // Отправляем найденное жилье
    res.status(200).json(housing);
  } catch (error) {
    console.error('Ошибка при получении каталога жилья:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении каталога жилья', error });
  }
};

