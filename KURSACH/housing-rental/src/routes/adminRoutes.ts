import { Router } from 'express';
import { 
  addCategory, 
  addCriterion, 
  deleteCategory, 
  deleteCriterion, 
  getAdminStats, 
  getCategories, 
  getCriteria, 
  getUsers,
  toggleUserStatus
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

export default router;
