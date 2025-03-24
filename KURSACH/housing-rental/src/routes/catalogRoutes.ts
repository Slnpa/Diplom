// src/routes/catalogRoutes.ts
import { Router } from 'express';
import { getCatalog, createHousing, deleteHousing} from '../controllers/catalogController';
import { authenticate } from '../middleware/authMiddleware'; // Импортируем middleware

const router = Router();

router.get('/', getCatalog); // Получить все объекты жилья
router.post('/', createHousing); // Создать новый объект жилья
router.delete('/:id', authenticate, deleteHousing); // Удалить объект жилья по id с проверкой авторизации

export default router;
