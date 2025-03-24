import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { createHousing } from './controllers/catalogController'; // Импорт контроллера
import authRoutes from './routes/authRoutes';
import catalogRoutes from './routes/catalogRoutes';
import prisma from './db';
import userRoutes from './routes/userRoutes';
import propertyRoutes from './routes/propertyRoutes';
import adminRoutes from './routes/adminRoutes';
import chatRoutes from './routes/chatRoutes';
import ownerRoutes from './routes/ownerRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:3001',
}));

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.post('/housing', upload.single('image'), createHousing); // Маршрут для создания жилья с загрузкой изображения
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/auth', authRoutes);
app.use('/users', userRoutes); // Применяем маршруты для работы с пользователями
app.use('/catalog', catalogRoutes);
app.use('/property', propertyRoutes);
app.use('/admin', adminRoutes);
app.use('/api', chatRoutes);
app.use('/stat', ownerRoutes);


// Запуск сервера
app.listen(PORT, async () => {
  await prisma.$connect();
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
