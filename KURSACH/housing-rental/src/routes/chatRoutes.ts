import express from 'express';
import { createChat, getChats, getChatsByProperty, getMessagesByChatId, sendMessage } from '../controllers/chatController';

const router = express.Router();

router.post('/chats', createChat);        // Создание чата
// Получение чатов для конкретного пользователя и жилья
router.get('/chats/:userId/:propertyId', getChatsByProperty);
router.get('/chats/:userId', getChats);  // Получение чатов пользователя
router.post('/messages', sendMessage);   // Отправка сообщения
router.get('/messages/:chatId', getMessagesByChatId); // Новый маршрут


export default router;
