import { Router } from 'express';
import { 
  addCategory, 
  addCriterion, 
  approveProperty, 
  deleteCategory, 
  deleteCriterion, 
  getAdminStats, 
  getCategories, 
  getCriteria, 
  getPendingProperties, 
  getUsers,
  toggleUserStatus,
  verifyUser
} from '../controllers/adminController';

const router = Router();

// Роуты для работы с категориями
router.post('/categories', addCategory); // Добавить категорию
router.get('/categories', getCategories); // Получить все категории
router.delete('/categories/:id', deleteCategory); // Удалить категорию

// Роуты для работы с критериями
router.post('/criteria', addCriterion); // Добавить критерий
router.get('/criteria', getCriteria); // Получить все критерии
router.delete('/criteria/:id', deleteCriterion); // Удалить критерий
// Маршрут для получения статистики администратора
router.get('/stats', getAdminStats);
// Получение всех пользователей
router.get('/users', getUsers);

// Изменение статуса активности пользователя
router.patch('/users/:userId/status', toggleUserStatus);

router.patch('/verify-user/:userId', verifyUser);

// Одобрение или отклонение жилья
router.put('/properties/:propertyId/status', approveProperty);

// GET /admin/properties/pending
router.get('/properties/pending', getPendingProperties);

export default router;
