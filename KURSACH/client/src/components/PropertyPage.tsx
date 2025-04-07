import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../styles/PropertyPage.css';
import BookingForm from './BookingForm';
import Reviews from './Review'; // Импортируем компонент Reviews
import { useBookingActions } from './useBookingActions';
import ChatComponent from './ChatComponent';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';


interface Property {
  id: number;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  images: PropertyImage[]; // Изменяем тип на массив изображений
  owner: {
    id: number;
    role: string;
    login: string;
    email: string;
  };
  category: {
    name: string; // Категория жилья
  };
  criteria: {
    name: string; // Название критерия
  }[]; // Список критериев
  bookings: {
    id: number;
    startDate: string;
    endDate: string;
    status: string;
    userId: number;
  }[]; 
}
interface PropertyImage {
  id: number;
  imageUrl: string;
}

const PropertyPage: React.FC = () => {
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null); // Добавляем состояние для ошибки
  const { id } = useParams();
  const userId = useSelector((state: any) => state.user.userId);
  const userRole = useSelector((state: any) => state.user.role);
  const navigate = useNavigate();
  
  const { acceptBooking, cancelBooking, setMessage } = useBookingActions();

  const [isBookingConfirmed, setIsBookingConfirmed] = useState<boolean>(false); // Состояние подтверждения бронирования

  const fetchProperty = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/property/${id}`);
      if (!response.ok) {
        throw new Error('Жилье не найдено');
      }
      const data = await response.json();
      setProperty(data);
      setError(null);
    } catch (error) {
      setError('Жилье было удалено или не найдено');
      setProperty(null);
    }
  }, [id]);

  // Функция для проверки, подтверждено ли бронирование текущего пользователя
  const checkBookingStatus = useCallback((bookings: any[]) => {
    const userBooking = bookings.find((booking) => String(booking.status) === 'CONFIRMED' && Number(booking.userId) === Number(userId));
    if (userBooking) {
      setIsBookingConfirmed(true); // Если найдено подтвержденное бронирование, обновляем состояние
    } else {
      setIsBookingConfirmed(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProperty();
    const intervalId = setInterval(() => {
      fetchProperty();
    }, 1000); // 1 секунда
    return () => clearInterval(intervalId);
  }, [fetchProperty]);

  useEffect(() => {
    if (property) {
      checkBookingStatus(property.bookings);
    }
  }, [property, checkBookingStatus]);

  const handleDeleteProperty = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить это жилье?')) return;
    try {
      const response = await fetch(`http://localhost:3000/catalog/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        navigate('/catalog');
      } else {
        const data = await response.json();
        console.error(data.message || 'Ошибка при удалении жилья');
      }
    } catch (error) {
      console.error('Ошибка при удалении жилья:', error);
    }
  };

  const updateBookingStatus = (bookingId: number, newStatus: string) => {
    setProperty((prevProperty) => {
      if (!prevProperty) return null;
      const updatedBookings = prevProperty.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      );
      return { ...prevProperty, bookings: updatedBookings };
    });
  };

  if (error) {
    return (
      <div>
        {error}. <button onClick={() => navigate('/catalog')}>Вернуться в каталог</button>
      </div>
    );
  }

  const statusTranslations: { [key: string]: string } = {
    PENDING: 'В ожидании',
    CONFIRMED: 'Подтверждено',
    CANCELLED: 'Отменено',
  };

  if (!property) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="property-page">
      <h1>{property.name}</h1>
      {property.images.length > 1 ? (
  <Slider
    dots={true}
    infinite={true}
    speed={500}
    slidesToShow={1}
    slidesToScroll={1}
    arrows={true}
  >
    {property.images.map((image) => (
      <div key={image.id}>
        <img
          src={`http://localhost:3000${image.imageUrl}`}
          alt={`Жилье ${image.id}`}
          style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
        />
      </div>
    ))}
  </Slider>
) : (
  property.images.length === 1 && (
    <img
      src={`http://localhost:3000${property.images[0].imageUrl}`}
      alt={`Жилье ${property.images[0].id}`}
      style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
    />
  )
)}

      <p><strong>Описание:</strong> {property.description}</p>
      <p><strong>Местоположение:</strong> {property.location}</p>
      <p><strong>Цена за ночь:</strong> {property.pricePerNight} руб.</p>
      <p><strong>Категория:</strong> {property.category.name}</p>
      <p><strong>Владелец:</strong> {property.owner.login} ({property.owner.email})</p>
      <div>
        <strong>Критерии:</strong>
        <ul>
          {property.criteria.map((criterion) => (
            <li key={criterion.name}>{criterion.name}</li>
          ))}
        </ul>
      </div>
      {userRole === 'OWNER' && (
        <div>
          <button onClick={() => navigate(`/property/${id}/edit`)}>Редактировать жилье</button>
          <button onClick={handleDeleteProperty}>Удалить жилье</button>
        </div>
      )}
      <h2>Доступные бронирования</h2>
      <ul>
        {property.bookings.map((booking) => {
          const startDate = new Date(booking.startDate).toLocaleDateString('ru-RU');
          const endDate = new Date(booking.endDate).toLocaleDateString('ru-RU');
          return (
            <li key={booking.id}>
              {startDate} - {endDate} ({statusTranslations[booking.status] || booking.status})
              {userRole === 'OWNER' && booking.status === 'PENDING' && (
                <div>
                  <button
                    onClick={async () => {
                      await acceptBooking(booking.id);
                      updateBookingStatus(booking.id, 'CONFIRMED');
                    }}
                  >
                    Принять
                  </button>
                  <button
                    onClick={async () => {
                      await cancelBooking(booking.id);
                      updateBookingStatus(booking.id, 'CANCELLED');
                    }}
                  >
                    Отменить
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {userRole === 'USER' && (
        <BookingForm propertyId={property.id} userId={Number(userId)} onBookingSuccess={setMessage} />
      )}
      <Reviews propertyId={property.id} isConfirmed={isBookingConfirmed} /> {/* Передаем параметр isBookingConfirmed */}

      {/* Добавляем компонент чата */}
      <ChatComponent ownerId={property.owner.id} userRole={userRole} propertyId={property.id} ownerName={property.owner.login}/>
    </div>
  );
};

export default PropertyPage;
