import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPanel.css';
import AdminStats from './AdminStats';
import UserManagement from './UserManagement'; // Импортируем компонент UserManagement
import '../styles/UserManagement.css'; // Импортируем стили для UserManagement

const AdminPanel: React.FC = () => {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [criteria, setCriteria] = useState<{ id: number; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newCriterion, setNewCriterion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { role: userRole } = useSelector((state: any) => state.user);

  // Проверка роли пользователя
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      alert('Доступ запрещен: требуется роль ADMIN');
      navigate('/catalog'); // Перенаправление на главную или другую страницу
    }
  }, [userRole, navigate]);

  // Загрузка существующих данных
  const fetchData = async () => {
    try {
      const [categoriesRes, criteriaRes] = await Promise.all([
        fetch('http://localhost:3000/admin/categories'),
        fetch('http://localhost:3000/admin/criteria'),
      ]);
      if (!categoriesRes.ok || !criteriaRes.ok) throw new Error('Ошибка загрузки данных');
      setCategories(await categoriesRes.json());
      setCriteria(await criteriaRes.json());
    } catch (err) {
      setError('Не удалось загрузить данные.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Добавление категории
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch('http://localhost:3000/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory }),
      });
      if (!res.ok) throw new Error('Ошибка добавления категории');
      const addedCategory = await res.json();
      setCategories((prev) => [...prev, addedCategory]);
      setNewCategory('');
    } catch {
      setError('Не удалось добавить категорию.');
    }
  };

  // Добавление критерия
  const addCriterion = async () => {
    if (!newCriterion.trim()) return;
    try {
      const res = await fetch('http://localhost:3000/admin/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCriterion }),
      });
      if (!res.ok) throw new Error('Ошибка добавления критерия');
      const addedCriterion = await res.json();
      setCriteria((prev) => [...prev, addedCriterion]);
      setNewCriterion('');
    } catch {
      setError('Не удалось добавить критерий.');
    }
  };

  // Удаление категории или критерия
  const deleteItem = async (id: number, type: 'category' | 'criterion') => {
    try {
      const endpoint = type === 'category' ? 'categories' : 'criteria';
      const res = await fetch(`http://localhost:3000/admin/${endpoint}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      if (type === 'category') setCategories((prev) => prev.filter((c) => c.id !== id));
      if (type === 'criterion') setCriteria((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Не удалось удалить элемент.');
    }
  };

  return (
    <div className="admin-panel">
      <h1>Панель администратора</h1>
      {error && <p className="error">{error}</p>}
      <section>
        <h2>Категории</h2>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              {category.name}{' '}
              <button onClick={() => deleteItem(category.id, 'category')}>Удалить</button>
            </li>
          ))}
        </ul>
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Новая категория"
        />
        <button onClick={addCategory}>Добавить категорию</button>
      </section>
      <section>
        <h2>Критерии</h2>
        <ul>
          {criteria.map((criterion) => (
            <li key={criterion.id}>
              {criterion.name}{' '}
              <button onClick={() => deleteItem(criterion.id, 'criterion')}>Удалить</button>
            </li>
          ))}
        </ul>
        <input
          value={newCriterion}
          onChange={(e) => setNewCriterion(e.target.value)}
          placeholder="Новый критерий"
        />
        <button onClick={addCriterion}>Добавить критерий</button>
      </section>
      
      {/* Вставляем компонент UserManagement */}
      <section>
        <h2>Управление пользователями</h2>
        <UserManagement /> {/* Вставка компонента */}
      </section>
      <section>
        <h2>Статистика для администратора</h2>
        <AdminStats />
      </section>
    </div>
  );
};

export default AdminPanel;
