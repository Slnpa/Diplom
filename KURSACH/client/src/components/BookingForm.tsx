import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ru } from 'date-fns/locale'; 
import '../styles/BookingForm.css'; // Импортируем файл с кастомными стилями

interface BookingFormProps {
  propertyId: number;
  userId: number;
  onBookingSuccess: (message: string) => void;
  bookings: {
    startDate: string;
    endDate: string;
    status: string; // Тип статуса
  }[];
}

const BookingForm: React.FC<BookingFormProps> = ({ propertyId, userId, onBookingSuccess, bookings }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');

  // Функция для получения списка всех занятых дат
  const getOccupiedDates = () => {
    return bookings
      .filter(booking => booking.status === 'CONFIRMED') // Отбираем только активные бронирования
      .flatMap(booking => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const dates = [];
        
        // Генерируем все даты в диапазоне между начальной и конечной датами
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        
        return dates;
      });
  };

  const occupiedDates = getOccupiedDates(); // Список всех занятых дат

  // Проверяем, занята ли выбранная дата
  const isDateUnavailable = (date: Date) => {
    return occupiedDates.some((occupiedDate) => 
      occupiedDate.toDateString() === date.toDateString()
    );
  };

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      setMessage('Пожалуйста, выберите даты.');
      onBookingSuccess('Пожалуйста, выберите даты.');
      return;
    }

    const bookingData = { propertyId, userId, startDate, endDate };

    try {
      const response = await fetch('http://localhost:3000/property/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        setMessage('Бронирование успешно создано!');
        onBookingSuccess('Бронирование успешно создано!');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Ошибка при создании бронирования');
        onBookingSuccess(data.message || 'Ошибка при создании бронирования');
      }
    } catch (error) {
      setMessage('Ошибка при создании бронирования');
      onBookingSuccess('Ошибка при создании бронирования');
    }
  };

  return (
    <div>
      <h2>Забронировать жилье</h2>
      <div>
        <label>Выберите дату начала:</label>
        <DatePicker
          selected={startDate}
          onChange={(date: Date | null) => date && setStartDate(date)} // Проверяем, не null ли дата
          locale={ru} // Устанавливаем русскую локализацию
          minDate={new Date()} // Не даем выбрать дату в прошлом
          filterDate={(date: Date) => !isDateUnavailable(date)} // Блокируем занятые даты
          placeholderText="Выберите дату начала"
          className="booking-datepicker" // Добавляем класс для инпута
        />
      </div>
      
      <div>
        <label>Выберите дату окончания:</label>
        <DatePicker
          selected={endDate}
          onChange={(date: Date | null) => date && setEndDate(date)} // Проверяем, не null ли дата
          locale={ru} // Устанавливаем русскую локализацию
          minDate={startDate || new Date()} // Минимальная дата для конца брони
          filterDate={(date: Date) => !isDateUnavailable(date)} // Блокируем занятые даты
          placeholderText="Выберите дату окончания"
          className="booking-datepicker" // Добавляем класс для инпута
        />
      </div>

      <button onClick={handleBooking}>Забронировать</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default BookingForm;
