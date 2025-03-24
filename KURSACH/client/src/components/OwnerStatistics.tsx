import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import '../styles/OwnerStatistics.css'; // Подключаем стили

interface Statistics {
  housingCount: number;
  bookingsCount: number;
  completedBookingsCount: number;
}

const OwnerStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const userId = useSelector((state: any) => state.user.userId);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(`http://localhost:3000/stat/statistics/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
        } else {
          console.error('Не удалось получить статистику');
        }
      } catch (error) {
        console.error('Ошибка при получении статистики:', error);
      }
    };

    fetchStatistics();
  }, [userId]);

  if (!statistics) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="owner-statistics">
      <h2>Статистика владельца</h2>
      <ul>
        <li><strong>Количество жилья:</strong> {statistics.housingCount}</li>
        <li><strong>Количество бронирований:</strong> {statistics.bookingsCount}</li>
        <li><strong>Количество подтвержденных бронирований:</strong> {statistics.completedBookingsCount}</li>
      </ul>
    </div>
  );
};

export default OwnerStatistics;
