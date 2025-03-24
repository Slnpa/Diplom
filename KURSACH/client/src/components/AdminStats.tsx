import React, { useEffect, useState } from 'react';
import '../styles/AdminPanel.css'; // Подключаем стили

const AdminStats: React.FC = () => {
  const [userCount, setUserCount] = useState<number>(0);
  const [propertyCount, setPropertyCount] = useState<number>(0);
  const [categoryStats, setCategoryStats] = useState<{ name: string; propertyCount: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Функция для получения статистики
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/admin/stats'); // Путь к вашему API для статистики

        // Проверяем, если статус ответа не OK
        if (!response.ok) {
          throw new Error('Не удалось загрузить статистику');
        }

        const data = await response.json();
        setUserCount(data.userCount);
        setPropertyCount(data.propertyCount);
        setCategoryStats(data.categories); // Заполняем статистику по категориям
      } catch (err) {
        setError('Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="admin-panel"><div>Загрузка статистики...</div></div>;
  }

  if (error) {
    return <div className="admin-panel"><div>{error}</div></div>;
  }

  return (
    <div className="admin-panel">
      <div>
        <h3>Количество пользователей: {userCount}</h3>
        <h3>Количество жилья: {propertyCount}</h3>
      </div>

      <h3>Статистика по категориям:</h3>
      <ul>
        {categoryStats.map((category) => (
          <li key={category.name}>
            {category.name}: {category.propertyCount} объектов
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminStats;
