import express, { Request, Response } from 'express'; // Импортировать типы
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
// Для скачивания файла (например, администратор скачивает документы)
app.get('/uploads/*', (req: Request<{ 0: string }>, res: Response) => {
  const filePath = path.join(__dirname, '../uploads', req.params[0]);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
});
// Статическая папка для отдачи файлов
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/uploads/verificationDocuments', express.static(path.join(__dirname, '../uploads/verificationDocuments')));
app.use('/uploads/housingDocuments', express.static(path.join(__dirname, '../uploads/housingDocuments')));



app.use(express.json());

// Настройка мультер для загрузки изображений и документов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'images') {
      cb(null, 'images/'); // Папка для изображений
    } else if (file.fieldname === 'verificationDocuments') {
      cb(null, 'uploads/verificationDocuments'); // Папка для документов верификации
    } else if (file.fieldname === 'housingDocuments') {
      cb(null, 'uploads/housingDocuments'); // Папка для документов жилья
    } else {
      console.error('Invalid file fieldname:', file.fieldname); // Логируем ошибку для неожиданного поля
      cb(new Error('Invalid file fieldname'), ''); // Ошибка, если поле не найдено
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Многократная загрузка для изображений и документов
export const multiUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'verificationDocuments', maxCount: 5 },
  { name: 'housingDocuments', maxCount: 5 },
]);

// Маршрут для создания жилья с загрузкой изображений и документов
app.post('/housing', multiUpload, createHousing); 

// Применяем маршруты
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
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
