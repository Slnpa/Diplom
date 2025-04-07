import { Request, Response } from 'express';
import prisma from '../db';

// Получение подробной информации о жилье по ID
export const getPropertyDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: {
        id: parseInt(id), // ID жилья
      },
      include: {
        owner: true,           // Включаем владельца
        category: true,        // Включаем категорию
        bookings: true,        // Включаем бронирования
        images: true,          // Включаем изображения
        criteria: {
          include: {
            criterion: true,   // Включаем сами критерии
          },
        },
      },
    });

    if (!property) {
      res.status(404).json({ message: 'Жилье не найдено' });
      return;
    }

    // Преобразуем данные
    const propertyWithDetails = {
      ...property,
      criteria: property.criteria.map((pc) => pc.criterion),
      images: property.images,  // Извлекаем путь изображения
    };

    res.status(200).json(propertyWithDetails);
  } catch (error) {
    console.error('Ошибка при получении жилья:', error);
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
};

// Получение всех бронирований для владельца
export const getOwnerBookings = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params; // Получаем ID владельца из токена (например, из middleware, если он аутентифицирован)
  try {
    const properties = await prisma.property.findMany({
      where: {
        ownerId: parseInt(userId), // Фильтруем по ID владельца
      },
      include: {
        bookings: {
          where: {
            status: 'PENDING', // Фильтруем бронирования по статусу PENDING
          },
        },
      },
    });

    // Если нет жилья или бронирований с PENDING статусом, возвращаем ошибку
    if (!properties || properties.length === 0) {
      res.status(404).json({ message: 'Нет бронирований для вашего жилья' });
      return;
    }

    // Возвращаем только те объекты, которые имеют хотя бы одно бронирование со статусом PENDING
    const filteredProperties = properties.filter(property => property.bookings.length > 0);

    res.status(200).json(filteredProperties); // Возвращаем все фильтрованные объекты
  } catch (error) {
    console.error('Ошибка при получении бронирований:', error);
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
};

// Получить историю бронирований для пользователя
export const getBookingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Извлекаем userId из параметров запроса (например, из JWT или сессии)
    const { userId } = req.params; 

    // Получаем все бронирования пользователя с детальной информацией о жилье
    const bookings = await prisma.booking.findMany({
      where: {
        userId: Number(userId), // Преобразуем в число для фильтрации
      },
      include: {
        property: true, // Включаем связанные данные о жилье
      },
    });

    if (bookings.length === 0) {
      res.status(404).json({ message: 'История бронирований не найдена' });
    }

    // Отправляем данные о бронированиях
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Ошибка при получении истории бронирований:', error);
    res.status(500).json({ message: 'Ошибка при получении данных' });
  }
};

// Создание бронирования
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const { propertyId, userId, startDate, endDate } = req.body;
  
  try {
    // Проверяем, не пересекаются ли даты с уже существующими бронированиями
    const existingBookings = await prisma.booking.findMany({
        where: {
          propertyId: propertyId,
          status: 'CONFIRMED',
          OR: [
            // Проверяем, пересекаются ли даты бронирования с выбранным диапазоном
            {
              startDate: { gte: new Date(startDate) }, 
              endDate: { lte: new Date(endDate) } // Пересечение с окончанием выбранного диапазона
            },
            {
              startDate: { lte: new Date(endDate) },
              endDate: { gte: new Date(startDate) } // Пересечение с началом выбранного диапазона
            }
          ],
        },
      });      

    if (existingBookings.length > 0) {
      res.status(400).json({ message: 'Этот период уже занят' });
      return;
    }

    // Создаем бронирование
    const newBooking = await prisma.booking.create({
      data: {
        userId,
        propertyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'PENDING', // Статус бронирования пока что ожидающий
      },
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Ошибка при создании бронирования:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании бронирования', error });
  }
};

// Контроллер для принятия бронирования
export const acceptBooking = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params; // ID бронирования из параметров

  try {
    // Находим бронирование по ID
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
    });

    if (!booking) {
      res.status(404).json({ message: 'Бронирование не найдено' });
      return;
    }

    // Проверка, что бронирование еще не подтверждено
    if (booking.status === 'CONFIRMED') {
      res.status(400).json({ message: 'Бронирование уже подтверждено' });
      return;
    }

    // Получаем все подтвержденные бронирования для данного объекта недвижимости
    const existingBookings = await prisma.booking.findMany({
      where: {
        propertyId: booking.propertyId,
        status: 'CONFIRMED', // Только подтвержденные бронирования
      },
    });

    // Проверяем, пересекаются ли даты с уже подтвержденными бронированиями
    const newStartDate = new Date(booking.startDate);
    const newEndDate = new Date(booking.endDate);

    for (const existingBooking of existingBookings) {
      const existingStartDate = new Date(existingBooking.startDate);
      const existingEndDate = new Date(existingBooking.endDate);

      // Проверка на пересечение дат
      if (
        (newStartDate >= existingStartDate && newStartDate < existingEndDate) ||
        (newEndDate > existingStartDate && newEndDate <= existingEndDate) ||
        (newStartDate <= existingStartDate && newEndDate >= existingEndDate)
      ) {
        res.status(400).json({ message: 'Данные даты уже заняты другим бронированием.' });
        return;
      }
    }

    // Если даты не пересекаются, обновляем статус бронирования
    const updatedBooking = await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: {
        status: 'CONFIRMED',
      },
    });

    // Отправляем ответ
    res.status(200).json({ message: 'Бронирование подтверждено', booking: updatedBooking });
    return;
  } catch (error) {
    console.error('Ошибка при подтверждении бронирования:', error);
    res.status(500).json({ message: 'Ошибка при подтверждении бронирования' });
    return;
  }
};

// Контроллер для отмены бронирования
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params; // ID бронирования из параметров

  try {
    // Находим бронирование по ID
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
    });

    if (!booking) {
      res.status(404).json({ message: 'Бронирование не найдено' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.status(400).json({ message: 'Бронирование уже отменено' });
      return;
    }

    // Обновляем статус бронирования
    const updatedBooking = await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: {
        status: 'CANCELLED',
      },
    });

    // Отправляем ответ
    res.status(200).json({ message: 'Бронирование отменено', booking: updatedBooking });
    return;
  } catch (error) {
    console.error('Ошибка при отмене бронирования:', error);
    res.status(500).json({ message: 'Ошибка при отмене бронирования' });
    return;
  }
};

export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, location, pricePerNight, categoryId, criteria, imageIdsToDelete } = req.body;

  // Если imageIdsToDelete это строка, пробуем преобразовать её в массив чисел
  let parsedImageIdsToDelete: number[] = [];
  if (typeof imageIdsToDelete === 'string') {
    try {
      parsedImageIdsToDelete = JSON.parse(imageIdsToDelete); // Преобразуем строку в массив
    } catch (error) {
      console.error('Ошибка при парсинге imageIdsToDelete:', error);
    }
  } else if (Array.isArray(imageIdsToDelete)) {
    // Если это уже массив, просто присваиваем его
    parsedImageIdsToDelete = imageIdsToDelete;
  }

  // Инициализируем массив для валидных критериев
  let validCriteria: number[] = [];

  // Если criteria это строка, пробуем распарсить её в массив
  if (typeof criteria === 'string') {
    try {
      // Преобразуем строку в массив
      const parsedCriteria = JSON.parse(criteria);

      // Проверяем, что результат это массив
      if (Array.isArray(parsedCriteria)) {
        // Отфильтровываем только валидные числа
        validCriteria = parsedCriteria
          .map((id: any) => Number(id)) // Преобразуем в числа
          .filter((id: number) => !isNaN(id)); // Отфильтровываем некорректные значения
      }
    } catch (error) {
      console.error('Ошибка при парсинге строки criteria:', error);
    }
  } else if (Array.isArray(criteria)) {
    // Если criteria уже является массивом, просто фильтруем его
    validCriteria = criteria.filter((id: any) => !isNaN(id)).map(Number);
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: { criteria: true, images: true }, // Включаем связанные с жильём изображения и критерии
    });

    if (!property) {
      res.status(404).json({ message: 'Жилье не найдено' });
      return;
    }

    // Если нужно удалить изображения, удаляем их
    if (parsedImageIdsToDelete && parsedImageIdsToDelete.length > 0) {
      await prisma.propertyImage.deleteMany({
        where: {
          id: { in: parsedImageIdsToDelete },
          propertyId: property.id, // Удаляем только изображения, связанные с данным жильем
        },
      });
    }

    // Обрабатываем новые изображения, если они есть
    console.log(req.files)
    const files = req.files as Express.Multer.File[];


    // Добавляем новые изображения, если они есть
    // Добавление изображений
    if (files && files.length > 0) {
      const imageData = files.map((file) => ({
        propertyId: Number(id),
        imageUrl: `/images/${file.filename}`,
      }));

      await prisma.propertyImage.createMany({
        data: imageData,
      });
    }

    // Обновляем основную информацию о жилье
    const updatedProperty = await prisma.property.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        location,
        pricePerNight: parseFloat(pricePerNight),
        category: categoryId ? { connect: { id: parseInt(categoryId) } } : undefined,
      },
    });

    // Если были переданы корректные критерии, обновляем их
    if (validCriteria.length > 0) {
      // Удаляем старые связи с критериями
      await prisma.propertyCriterion.deleteMany({
        where: { propertyId: Number(id) },
      });

      // Создаем новые связи с критериями
      const criterionConnections = validCriteria.map((criterionId: number) => ({
        propertyId: updatedProperty.id,
        criterionId,
      }));

      // Создаём связи с критериями
      await prisma.propertyCriterion.createMany({
        data: criterionConnections,
      });
    }

    // Получаем обновленные данные о жилье, включая изображения
    const propertyWithUpdatedImages = await prisma.property.findUnique({
      where: { id: updatedProperty.id },
      include: { images: true },
    });

    res.status(200).json(propertyWithUpdatedImages);
  } catch (error) {
    console.error('Ошибка при обновлении жилья:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении жилья', error });
  }
};

// Получить все отзывы для конкретного жилья
export const getReviewsByProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    // Проверка на правильность формата propertyId
    if (isNaN(Number(propertyId))) {
      res.status(400).json({ message: 'Неверный формат propertyId' });
      return;
    }

    // Получаем все отзывы для данного жилья
    const reviews = await prisma.review.findMany({
      where: {
        propertyId: Number(propertyId), // Фильтрация по propertyId
      },
      include: {
        user: {
          select: {
            id: true,
            login: true, // Отображаем имя пользователя, оставившего отзыв
          },
        },
      },
    });

    // Отправляем отзывы
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    res.status(500).json({ message: 'Ошибка при получении данных' });
  }
};

// Добавить новый отзыв
export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId, userId, rating, comment } = req.body;

    // Проверка на существование отзыва для данного propertyId и userId
    const existingReview = await prisma.review.findUnique({
      where: {
        propertyId_userId: {
          propertyId: Number(propertyId),
          userId: Number(userId),
        },
      },
    });

    if (existingReview) {
      // Если отзыв существует, обновляем его
      const updatedReview = await prisma.review.update({
        where: {
          id: existingReview.id, // Обновляем существующий отзыв по его id
        },
        data: {
          rating,
          comment,
        },
        include: { user: true }, // Подключаем данные пользователя
      });
      // Отправляем успешный ответ с обновленным отзывом
       res.status(200).json(updatedReview);
    }else {
      // Если отзыва нет, создаем новый
      const newReview = await prisma.review.create({
        data: {
          propertyId: Number(propertyId),
          userId: Number(userId),
          rating,
          comment,
        },
        include: { user: true }, // Подключаем данные пользователя
      });
      res.status(201).json(newReview);  // Отправляем новый отзыв
    }
  } catch (error) {
    console.error('Ошибка при добавлении/обновлении отзыва:', error);
    res.status(500).json({ message: 'Ошибка при добавлении/обновлении отзыва' });
  }
};




