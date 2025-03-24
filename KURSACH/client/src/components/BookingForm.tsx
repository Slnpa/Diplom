import React, { useState } from 'react';

interface BookingFormProps {
  propertyId: number;
  userId: number;
  onBookingSuccess: (message: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ propertyId, userId, onBookingSuccess }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState(''); // Оставим это, чтобы отображать сообщение на экране

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      const errorMessage = 'Пожалуйста, выберите даты.';
      setMessage(errorMessage); // Сохраняем сообщение об ошибке
      onBookingSuccess(errorMessage); // Передаем сообщение через onBookingSuccess
      return;
    }

    const bookingData = {
      propertyId,
      userId,
      startDate,
      endDate,
    };

    try {
      const response = await fetch('http://localhost:3000/property/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const successMessage = 'Бронирование успешно создано!';
        setMessage(successMessage); // Сохраняем сообщение об успехе
        onBookingSuccess(successMessage); // Передаем сообщение через onBookingSuccess
      } else {
        const data = await response.json();
        const errorMessage = data.message || 'Ошибка при создании бронирования';
        setMessage(errorMessage); // Сохраняем сообщение об ошибке
        onBookingSuccess(errorMessage); // Передаем сообщение через onBookingSuccess
      }
    } catch (error) {
      console.error('Ошибка при создании бронирования:', error);
      const errorMessage = 'Ошибка при создании бронирования';
      setMessage(errorMessage); // Сохраняем сообщение об ошибке
      onBookingSuccess(errorMessage); // Передаем сообщение через onBookingSuccess
    }
  };

  return (
    <div>
      <h2>Забронировать жилье</h2>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]} // Ограничение на сегодняшнюю дату
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        min={startDate}
      />
      <button onClick={handleBooking}>Забронировать</button>
      {message && <p>{message}</p>} {/* Отображение сообщения о статусе */}
    </div>
  );
};

export default BookingForm;
