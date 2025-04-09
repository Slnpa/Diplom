import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ru } from 'date-fns/locale'; // Локализация на русский
import '../styles/BookingForm.css'; // Если нужно добавить стили

interface ExternalBookingFormProps {
  propertyId: number;
  bookings: { startDate: string; endDate: string; status: string; }[]; // Добавляем бронирования
}

const ExternalBookingForm: React.FC<ExternalBookingFormProps> = ({ propertyId, bookings }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
          dates.push(new Date(d).toISOString().split('T')[0]); // Преобразуем дату в строку (yyyy-mm-dd)
        }

        return dates;
      });
  };

  const occupiedDates = getOccupiedDates(); // Список всех занятых дат

  // Проверяем, занята ли выбранная дата
  const isDateUnavailable = (date: Date) => {
    return occupiedDates.includes(date.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (startDate && endDate) {
      if (isDateUnavailable(startDate) || isDateUnavailable(endDate)) {
        setMessage('Выбранные даты уже заняты');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/stat/book-external', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            propertyId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMessage('Бронирование успешно создано!');
          setName('');
          setEmail('');
          setStartDate(null);
          setEndDate(null);
        } else {
          setMessage(data.message || 'Ошибка при бронировании');
        }
      } catch (error) {
        console.error(error);
        setMessage('Произошла ошибка на сервере');
      }
    } else {
      setMessage('Пожалуйста, выберите даты.');
    }
  };

  return (
    <div>
      <h3>Забронировать для клиента</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Имя клиента"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email клиента"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <div>
          <label>Выберите дату начала:</label>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
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
            onChange={(date: Date | null) => setEndDate(date)}
            locale={ru} // Устанавливаем русскую локализацию
            minDate={startDate || new Date()} // Минимальная дата для конца брони
            filterDate={(date: Date) => !isDateUnavailable(date)} // Блокируем занятые даты
            placeholderText="Выберите дату окончания"
            className="booking-datepicker" // Добавляем класс для инпута
          />
        </div>

        <button type="submit">Создать бронирование</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ExternalBookingForm;
