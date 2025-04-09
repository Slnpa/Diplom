import { Router } from 'express';
import { getUserVerificationStatus, updateUserRole, uploadVerificationDocuments } from '../controllers/userController';

const router = Router();

// Обновить роль пользователя
router.put('/:userId/role', updateUserRole);

// Загрузить документы для верификации
router.post('/:userId/verify', uploadVerificationDocuments);

// Получить статус верификации пользователя
router.get('/:userId/verify-status', getUserVerificationStatus);

export default router;
