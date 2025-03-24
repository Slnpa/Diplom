import { Request, Response } from 'express';
import prisma from '../db';

// Добавление категории
export const addCategory = async (req: Request, res: Response) : Promise<void> => {
  const { name } = req.body;
  if (!name) res.status(400).json({ message: 'Название категории обязательно' });
  try {
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
};

// Добавление критерия
export const addCriterion = async (req: Request, res: Response) : Promise<void> => {
  const { name } = req.body;
  if (!name) res.status(400).json({ message: 'Название критерия обязательно' });
  try {
    const criterion = await prisma.criterion.create({ data: { name } });
    res.status(201).json(criterion);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
};

// Удаление категории
export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.category.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: 'Категория удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления категории', error });
  }
};

// Удаление критерия
export const deleteCriterion = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
       res.status(400).json({ message: 'Неверный идентификатор критерия' });
    }
  
    try {
      // Проверка существования критерия
      const existingCriterion = await prisma.criterion.findUnique({ where: { id: Number(id) } });
  
      if (!existingCriterion) {
         res.status(404).json({ message: 'Критерий не найден' });
      }
  
      // Удаление связей с этим критерием в промежуточной таблице
      await prisma.propertyCriterion.deleteMany({
        where: { criterionId: Number(id) },
      });
  
      // Удаление критерия
      await prisma.criterion.delete({ where: { id: Number(id) } });
  
      res.status(200).json({ message: 'Критерий удален' });
    } catch (error) {
      console.error('Ошибка удаления критерия:', error);
      res.status(500).json({ message: 'Ошибка удаления критерия', error });
    }
  };
  
// Получение всех категорий
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка загрузки категорий', error });
  }
};

// Получение всех критериев
export const getCriteria = async (_req: Request, res: Response) => {
  try {
    const criteria = await prisma.criterion.findMany();
    res.status(200).json(criteria);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка загрузки критериев', error });
  }
};

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Получаем количество пользователей
    const userCount = await prisma.user.count();

    // Получаем количество жилья
    const propertyCount = await prisma.property.count();

    // Получаем количество объектов для каждой категории
    const categoryStats = await prisma.category.findMany({
      select: {
        name: true, // Название категории
        _count: {
          select: {
            properties: true, // Количество объектов в категории
          },
        },
      },
    });

    // Формируем статистику
    const stats = {
      userCount,
      propertyCount,
      categories: categoryStats.map((category) => ({
        name: category.name,
        propertyCount: category._count.properties,
      })),
    };

    // Отправляем статистику
    res.status(200).json(stats);
  } catch (error) {
    console.error('Ошибка при получении статистики для администратора:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении статистики', error });
  }
};

// Получение списка пользователей, исключая администраторов
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN', // Исключаем пользователей с ролью ADMIN
        },
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователей' });
  }
};


// Изменение статуса активности пользователя
export const toggleUserStatus = async (req: Request, res: Response) => {
  const { userId } = req.params; // ID пользователя из URL
  const { isActive } = req.body; // Новое значение активности

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { isActive },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при изменении статуса пользователя' });
  }
};