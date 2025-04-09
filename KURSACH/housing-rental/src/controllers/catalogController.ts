import { Request, Response } from 'express';
import prisma from '../db';
import { multiUpload } from '../middleware/upload'

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

  // Валидация обязательных полей
  if (!name || !description || !location || !pricePerNight || !ownerId || !categoryId) {
    res.status(400).json({ message: 'Все поля, кроме изображений и документов, обязательны' });
    return;
  }

  try {
    // Создание жилья
    const newProperty = await prisma.property.create({
      data: {
        name,
        description,
        location,
        pricePerNight: parseFloat(pricePerNight),
        status: 'PENDING', // Статус по умолчанию
        owner: {
          connect: { id: parseInt(ownerId) },
        },
        category: {
          connect: { id: parseInt(categoryId) },
        },
      },
    });

    // Обработка изображений
    const images = (req.files as any)?.images as Express.Multer.File[] | undefined;
    if (images && images.length > 0) {
      const imageData = images.map((file) => ({
        propertyId: newProperty.id,
        imageUrl: `/images/${file.filename}`,
      }));

      await prisma.propertyImage.createMany({
        data: imageData,
      });
    }

    // Обработка критериев
    if (criteria && criteria.length > 0) {
      const criteriaArray = Array.isArray(criteria) ? criteria : [criteria]; // поддержка одиночного значения
      const criterionConnections = criteriaArray.map((criterionId: string) => ({
        propertyId: newProperty.id,
        criterionId: parseInt(criterionId),
      }));

      await prisma.propertyCriterion.createMany({
        data: criterionConnections,
      });
    }

    // Обработка документов жилья
    const housingDocuments = (req.files as any)?.housingDocuments as Express.Multer.File[] | undefined;
    if (housingDocuments && housingDocuments.length > 0) {
      const documentData = housingDocuments.map((file) => ({
        propertyId: newProperty.id,
        fileUrl: `/uploads/housingDocuments/${file.filename}`,
      }));

      await prisma.propertyDocument.createMany({
        data: documentData,
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
    const userId = parseInt(req.query.userId as string);
    const userRole = req.query.userRole as string;

    const housingQuery = {
      include: {
        owner: {
          select: { login: true, email: true, id: true },
        },
        bookings: {
          select: { startDate: true, endDate: true, status: true },
        },
        category: true,
        images: {
          take: 1,
          select: { imageUrl: true },
        },
        criteria: {
          include: { criterion: true },
        },
      },
    };

    let housing;

    if (userRole === 'OWNER' && userId) {
      // Владелец видит только своё жильё
      housing = await prisma.property.findMany({
        where: { ownerId: userId },
        ...housingQuery,
      });
    } else if (userRole === 'ADMIN' && userId) {
      // Админ видит всё (без фильтра по статусу)
      housing = await prisma.property.findMany({
        ...housingQuery,
      });
    } else if (userId) {
      // Остальные (например, USER) — только одобренное чужое жильё
      housing = await prisma.property.findMany({
        where: {
          ownerId: { not: userId },
          status: 'APPROVED',
        },
        ...housingQuery,
      });
    } else {
      // Незарегистрированный пользователь — только одобренное жильё
      housing = await prisma.property.findMany({
        where: { status: 'APPROVED' },
        ...housingQuery,
      });
    }

    if (housing.length === 0) {
      res.status(404).json({ message: 'Жилье не найдено' });
      return;
    }

    res.status(200).json(housing);
  } catch (error) {
    console.error('Ошибка при получении каталога жилья:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении каталога жилья', error });
  }
};



