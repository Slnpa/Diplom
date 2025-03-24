import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const JWT_SECRET = 'pahapodoben'; // Используйте безопасное секретное значение и храните его в .env файле

// Регистрация пользователя
export const register = async (req: Request, res: Response): Promise<void> => {
  const { login, password, email } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ login }, { email }],
      },
    });

    if (existingUser) {
      res.status(400).json({ message: 'Пользователь с таким логином или email уже существует.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
        email,
        role: 'USER', // Роль по умолчанию
      },
    });

    // Генерация токена
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, isActive: newUser.isActive },
      JWT_SECRET,
      { expiresIn: '1000h' }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token, // Токен с ролью
    });
  } catch (error) {
    console.error("Ошибка при регистрации пользователя:", error);
    res.status(500).json({ message: 'Ошибка при регистрации пользователя', error });
  }
};

  
// Авторизация пользователя
export const login = async (req: Request, res: Response) : Promise<void> => {
  const { login, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { login },
    });

    if (!user) {
      res.status(400).json({ message: 'Неверный логин или пароль' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: 'Неверный логин или пароль' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role, isActive: user.isActive }, JWT_SECRET, {
      expiresIn: '1000h',
    });

    res.status(200).json({ message: 'Авторизация успешна', token });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при авторизации', error });
  }
};

export const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
  const { login, email, password, oldPassword } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  console.log(req.body)
  console.log(oldPassword)
  if (!token) {
    res.status(401).json({ message: 'Не авторизован' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    // Если новый пароль передан, проверяем старый пароль
    if (password) {
      if (!oldPassword) {
        res.status(400).json({ message: 'Для изменения пароля необходимо ввести старый пароль' });
        return;
      }

      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        res.status(400).json({ message: 'Неверный старый пароль' });
        return;
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ login }, { email }],
        NOT: [{ id: decoded.userId }],
      },
    });

    if (existingUser) {
      res.status(400).json({ message: 'Пользователь с таким логином или email уже существует.' });
      return;
    }

    let updatedPassword = user.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        login: login || user.login,
        email: email || user.email,
        password: updatedPassword, // Обновляем только если новый пароль был передан
      },
    });

    res.status(200).json({ message: 'Информация пользователя успешно обновлена', user: updatedUser });
  } catch (error) {
    console.error("Ошибка при обновлении информации пользователя:", error);
    res.status(500).json({ message: 'Ошибка при обновлении информации', error });
  }
};


