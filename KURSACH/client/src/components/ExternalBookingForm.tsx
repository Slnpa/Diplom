import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ru } from 'date-fns/locale';
import '../styles/BookingForm.css';

interface ExternalBookingFormProps {
  propertyId: number;
  bookings: { startDate: string; endDate: string; status: string }[];
}

const ExternalBookingForm: React.FC<ExternalBookingFormProps> = ({ propertyId, bookings }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');

  const userId = useSelector((state: any) => state.user.userId); // Получаем userId из Redux

  // Функция для получения списка всех занятых дат
  const getOccupiedDates = () => {
    return bookings
      .filter(booking => booking.status === 'CONFIRMED')
      .flatMap(booking => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const dates = [];

        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d).toISOString().split('T')[0]);
        }

        return dates;
      });
  };

  const occupiedDates = getOccupiedDates();

  // Проверяем, занята ли выбранная дата
  const isDateUnavailable = (date: Date) => {
    return occupiedDates.includes(date.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setMessage('Пожалуйста, войдите в систему.');
      return;
    }

    if (!name) {
      setMessage('Пожалуйста, укажите имя клиента.');
      return;
    }

    if (startDate && endDate) {
      if (isDateUnavailable(startDate) || isDateUnavailable(endDate)) {
        setMessage('Выбранные даты уже заняты');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Токен аутентификации не найден. Пожалуйста, войдите в систему.');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/stat/book-external', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            propertyId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            userId, // Передаём userId в теле запроса
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMessage('Бронирование успешно создано!');
          setName('');
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
          placeholder="Имя клиента (например, Моя подруга Лена)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <div>
          <label>Выберите дату начала:</label>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            locale={ru}
            minDate={new Date()}
            filterDate={(date: Date) => !isDateUnavailable(date)}
            placeholderText="Выберите дату начала"
            className="booking-datepicker"
          />
        </div>
        
        <div>
          <label>Выберите дату окончания:</label>
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            locale={ru}
            minDate={startDate || new Date()}
            filterDate={(date: Date) => !isDateUnavailable(date)}
            placeholderText="Выберите дату окончания"
            className="booking-datepicker"
          />
        </div>

        <button type="submit" className="submit-button">Создать бронирование</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ExternalBookingForm;