import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Создание чата (уникальный между ownerId, userId и propertyId)
export const createChat = async (req: Request, res: Response) => {
  const { ownerId, userId, propertyId } = req.body;

  try {
    // Проверяем, существует ли чат
    const existingChat = await prisma.chat.findFirst({
      where: {
        ownerId: Number(ownerId),
        userId: Number(userId),
        propertyId: Number(propertyId), // Учитываем также propertyId
      },
    });

    if (existingChat) {
      // Если чат существует, возвращаем его
      res.status(200).json(existingChat);
      return;
    }

    // Создаём новый чат
    const chat = await prisma.chat.create({
      data: {
        ownerId: Number(ownerId),
        userId: Number(userId),
        propertyId: Number(propertyId), // Добавляем propertyId
      },
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Получение всех чатов пользователя
export const getChats = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { ownerId: parseInt(userId) },
          { userId: parseInt(userId) },
        ],
      },
      include: { messages: true, user: true, owner: true, property: true },
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Получение чатов по propertyId (если нужно)
export const getChatsByProperty = async (req: Request, res: Response) => {
  const { userId, propertyId } = req.params;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        propertyId: Number(propertyId),
        OR: [
          { ownerId: parseInt(userId) },
          { userId: parseInt(userId) },
        ],
      },
      include: { messages: true, user: true, owner: true, property: true },
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Отправка сообщения
export const sendMessage = async (req: Request, res: Response) => {
  const { chatId, senderId, content } = req.body;

  try {
    const message = await prisma.message.create({
      data: {
        chatId: parseInt(chatId),
        senderId: parseInt(senderId),
        content,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Получение сообщений чата
export const getMessagesByChatId = async (req: Request, res: Response) => {
  const { chatId } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: { chatId: parseInt(chatId) },
      orderBy: { createdAt: 'asc' }, // Сортировка сообщений по времени
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
