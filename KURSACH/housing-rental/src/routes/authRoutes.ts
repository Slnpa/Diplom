import { Router } from 'express';
import { register, login, updateUserInfo } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// Маршрут для обновления личных данных пользователя
router.put('/user/update', updateUserInfo);

export default router;
