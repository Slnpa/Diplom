import { Request, Response } from 'express';
import prisma from '../db';
import multer from 'multer';

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

    // Получаем пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    // Проверяем, если пользователь не верифицирован и хочет стать владельцем
    if (newRole === 'OWNER' && !user?.isVerified) {
      res.status(400).json({ message: 'Пользователь не прошел верификацию, не может быть владельцем' });
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

// Настроим хранилище для загрузки документов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/verificationDocuments'); // Папка для хранения документов
  },
  filename: (req, file, cb) => {
    const { userId } = req.params;
    cb(null, `${userId}-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Функция для загрузки документов
export const uploadVerificationDocuments = [
  upload.single('documents'), // Загружаем только один файл (можно сделать массив, если нужно)
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!req.file) {
      res.status(400).json({ message: 'Пожалуйста, загрузите документ для верификации' });
      return;
    }

    try {
      // Обновляем статус пользователя в базе данных (если все хорошо)
      const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          documentUrl: req.file.path, // Путь к загруженному документу
        },
      });

      res.status(200).json({ message: 'Документ успешно загружен. Ожидайте верификации.' });
    } catch (error) {
      console.error('Ошибка при загрузке документа:', error);
      res.status(500).json({ message: 'Ошибка при загрузке документа' });
    }
  },
];

// Получение статуса верификации пользователя
export const getUserVerificationStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    // Находим пользователя по userId
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { isVerified: true } // Только поле isVerified
    });

    // Если пользователь не найден, возвращаем ошибку
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    // Отправляем статус верификации
    res.status(200).json({ isVerified: user.isVerified });
  } catch (error) {
    console.error('Ошибка при получении статуса верификации:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении статуса верификации' });
  }
};