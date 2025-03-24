import { Router } from 'express';
import { updateUserRole } from '../controllers/userController';

const router = Router();

// Обновить роль пользователя
router.put('/:userId/role', updateUserRole);

export default router;
