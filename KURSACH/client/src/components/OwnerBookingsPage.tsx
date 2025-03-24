import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../styles/OwnerBookingsPage.css';

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  property: {
    id: number;
    name: string;
    imageUrl: string;
    description: string;
    location: string;
    pricePerNight: number;
  };
}

const OwnerBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();
  const userId = useSelector((state: any) => state.user.userId);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/property/owner/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const allBookings = data.flatMap((property: any) =>
          property.bookings.filter((booking: any) => booking.status === 'PENDING')
            .map((booking: any) => ({
              ...booking,
              property: property
            }))
        );
        
        setBookings(allBookings);
      } else {
        console.error('Ошибка при получении бронирований');
      }
    } catch (error) {
      console.error('Ошибка при получении бронирований:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBookings();

      const intervalId = setInterval(() => {
        fetchBookings();
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [fetchBookings, userId]);

  const goToPropertyPage = (propertyId: number) => {
    navigate(`/property/${propertyId}`);
  };

  if (bookings.length === 0) {
    return <div className="message">Нет бронирований для обработки</div>;
  }

  return (
    <div className="container">
      <h1 className="title">Запросы на бронирование</h1>
      <ul className="list">
        {bookings.map((booking) => {
          const property = booking.property;
          const propertyName = property?.name || 'Без имени';
          const startDate = new Date(booking.startDate).toLocaleDateString('ru-RU');
          const endDate = new Date(booking.endDate).toLocaleDateString('ru-RU');

          return (
            <li key={booking.id} className="list-item">
              <div className="booking-details">
                <strong>Имя жилья: {propertyName}</strong> 
                <p>Даты: {startDate} - {endDate} (ОЖИДАНИЕ)</p>
              </div>
              <button className="go-to-button" onClick={() => goToPropertyPage(property?.id || 0)}>
                Перейти к жилью
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OwnerBookingsPage;
