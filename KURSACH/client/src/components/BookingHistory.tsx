import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import '../styles/BookingHistory.css';

interface Property {
  id: number;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  imageUrl: string;
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  property: Property;
}

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'startDate' | 'propertyName'>('startDate');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const userId = useSelector((state: any) => state.user.userId);

  const statusTranslations: Record<string, string> = {
    PENDING: 'В ожидании',
    CONFIRMED: 'Подтверждено',
    CANCELLED: 'Отменено',
  };

  const fetchBookingHistory = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/property/user-history/${userId}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить историю бронирований');
      }
      const data = await response.json();
      setBookings(data);
      setError(null);
    } catch (error) {
      setError('Ошибка при загрузке данных');
      console.error('Ошибка при загрузке данных:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookingHistory();

    const intervalId = setInterval(() => {
      fetchBookingHistory();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [fetchBookingHistory]);

  useEffect(() => {
    let filtered = bookings;

    // Фильтрация по статусу
    if (filterStatus) {
      filtered = filtered.filter((booking) => booking.status === filterStatus);
    }

    // Сортировка
    if (sortOrder === 'startDate') {
      filtered = filtered.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } else if (sortOrder === 'propertyName') {
      filtered = filtered.sort((a, b) =>
        a.property.name.localeCompare(b.property.name)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, sortOrder, filterStatus]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h2 className="title">История бронирований</h2>
      <div className="controls">
        <select onChange={(e) => setSortOrder(e.target.value as 'startDate' | 'propertyName')}>
          <option value="startDate">По дате</option>
          <option value="propertyName">По имени жилья</option>
        </select>
        <select onChange={(e) => setFilterStatus(e.target.value || null)}>
          <option value="">Все</option>
          {Object.entries(statusTranslations).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {filteredBookings.length === 0 ? (
        <p className="no-bookings">Нет истории бронирований</p>
      ) : (
        <div className="booking-cards">
          {filteredBookings.map((booking) => {
            const startDate = new Date(booking.startDate).toLocaleDateString('ru-RU');
            const endDate = new Date(booking.endDate).toLocaleDateString('ru-RU');

            return (
              <div key={booking.id} className="booking-card">
                <div className="booking-details">
                  <h3>{booking.property.name}</h3>
                  <p>
                    {startDate} - {endDate} ({statusTranslations[booking.status] || booking.status})
                  </p>
                  <p>Цена за ночь: {booking.property.pricePerNight} руб.</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
