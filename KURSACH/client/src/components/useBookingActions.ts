import { useState } from 'react';

export const useBookingActions = () => {
  const [message, setMessage] = useState<string>('');

  // Функция для принятия бронирования
  const acceptBooking = async (bookingId: number) => {
    const token = localStorage.getItem('token'); // Получаем токен из localStorage (или другого хранилища)

    if (!token) {
      setMessage('Токен не найден. Пожалуйста, войдите в систему.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/property/booking/${bookingId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Передаем токен в заголовке
        },
      });

      if (response.ok) {
        setMessage('Бронирование принято!');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Ошибка при принятии бронирования');
      }
    } catch (error) {
      console.error('Ошибка при принятии бронирования:', error);
      setMessage('Ошибка при принятии бронирования');
    }
  };

  // Функция для отмены бронирования
  const cancelBooking = async (bookingId: number) => {
    const token = localStorage.getItem('token'); // Получаем токен из localStorage (или другого хранилища)

    if (!token) {
      setMessage('Токен не найден. Пожалуйста, войдите в систему.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/property/booking/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Передаем токен в заголовке
        },
      });

      if (response.ok) {
        setMessage('Бронирование отменено!');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Ошибка при отмене бронирования');
      }
    } catch (error) {
      console.error('Ошибка при отмене бронирования:', error);
      setMessage('Ошибка при отмене бронирования');
    }
  };

  return { message, acceptBooking, cancelBooking, setMessage };
};
