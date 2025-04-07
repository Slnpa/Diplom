import express from 'express';
import { getPropertyDetails, createBooking, acceptBooking, cancelBooking, updateProperty, getOwnerBookings, getBookingHistory, getReviewsByProperty, addReview } from '../controllers/propertyController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

// Создание хранилища для файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Генерация уникального имени файла
  },
});
const upload = multer({ storage }); // Настройка multer

const router = express.Router();

// Получение подробной информации о жилье
router.get('/:id', getPropertyDetails);

// Получение подробной информации о жилье
router.get('/owner/:userId', getOwnerBookings);
// Маршрут для получения истории бронирований пользователя
router.get('/user-history/:userId', getBookingHistory);
// Создание бронирования
router.post('/booking', createBooking);

// Принять бронирование
router.put('/booking/:bookingId/accept', authenticate, acceptBooking);

// Отменить бронирование
router.put('/booking/:bookingId/cancel', authenticate, cancelBooking);

// Редактирование информации о жилье с загрузкой изображения
router.put('/:id', upload.array('images'), updateProperty);  // Используем .array('images') вместо .single('image')

router.get('/:propertyId/reviews', getReviewsByProperty);
router.post('/reviews', addReview);


export default router;
