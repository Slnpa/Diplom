import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUserRole, logout } from '../slices/userSlice';
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Данные пользователя из Redux
  const { role: userRole, userName, userId } = useSelector((state: any) => state.user);

  const [pendingBookings, setPendingBookings] = useState<number>(0); // Количество ожидающих бронирований

  // Функция для получения количества ожидающих бронирований
  const fetchPendingBookings = useCallback(async () => {
    try {
      if (userRole === 'OWNER') {
        const response = await fetch(`http://localhost:3000/property/owner/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const pendingCount = data.flatMap((property: any) => property.bookings)
            .filter((booking: any) => booking.status === 'PENDING')
            .length;

          setPendingBookings(pendingCount);
        } else {
          console.error('Ошибка при получении бронирований');
        }
      }
    } catch (error) {
      console.error('Ошибка при получении бронирований:', error);
    }
  }, [userRole, userId]);

  // Выполнение запроса при изменении userId или userRole
  useEffect(() => {
    if (userRole === 'OWNER') {
      fetchPendingBookings();

      // Настроим обновление каждую секунду
      const intervalId = setInterval(() => {
        fetchPendingBookings();
      }, 1000);

      // Очищаем интервал при размонтировании компонента
      return () => clearInterval(intervalId);
    }
  }, [fetchPendingBookings, userRole, userId]);

  // Общая функция для смены роли
  const handleRoleSwitch = async (newRole: string, successMessage: string) => {
    if (!userId) {
      alert('Ошибка: не найден ID пользователя');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole }),
      });

      const data = await response.json();
      if (response.ok) {
        dispatch(setUserRole(newRole));
        alert(successMessage);
        navigate('/catalog');
      } else {
        alert(data.message || 'Ошибка при смене роли');
      }
    } catch (error) {
      console.error('Ошибка при смене роли:', error);
      alert('Ошибка при смене роли');
    }
  };

  // Выход пользователя
  const handleLogout = () => {
    ['token', 'role', 'userName', 'userId'].forEach((key) => localStorage.removeItem(key));
    dispatch(logout());
    navigate('/catalog');
  };

  // Проверка на гостя
  const isGuest = !userRole;

  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li><Link to="/catalog">Каталог</Link></li>
        {isGuest ? (
          <>
            <li><Link to="/login">Войти</Link></li>
            <li><Link to="/register">Зарегистрироваться</Link></li>
          </>
        ) : (
          <>
            <li>Привет, {userName}, ваша роль: {userRole}</li>
            {userRole === 'USER' && (
              <>
                <li>
                  <button onClick={() => navigate(`/user-history/${userId}`)}>
                    История бронирований
                  </button>
                </li>
                <li>
                  <button onClick={() => handleRoleSwitch('OWNER', 'Вы стали владельцем!')}>
                    Стать владельцем
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate(`/user-settings/${userId}`)}>
                    Настройки пользователя
                  </button>
                </li>
                {/* Добавляем переход к чату */}
                <li>
                  <button onClick={() => navigate(`/user-chats/${userId}`)}>
                    Мои чаты
                  </button>
                </li>
              </>
            )}
            {userRole === 'OWNER' && (
              <>
                {pendingBookings > 0 && (
                  <li>
                    <button onClick={() => navigate(`/owner/${userId}`)}>
                      У вас есть {pendingBookings} новых запросов на бронирование
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={() => handleRoleSwitch('USER', 'Вы стали пользователем!')}>
                    Стать пользователем
                  </button>
                </li>
                {/* Добавляем переход к чату */}
                <li>
                  <button onClick={() => navigate(`/user-chats/${userId}`)}>
                    Мои чаты
                  </button>
                </li>
                {/* Добавляем ссылку на статистику владельца */}
                <li>
                  <button onClick={() => navigate('/statistics')}>
                    Статистика владельца
                  </button>
                </li>
              </>
            )}
            {userRole === 'ADMIN' && (
              <li>
                <button onClick={() => navigate('/admin')}>
                  Админка
                </button>
              </li>
            )}
            <li><button onClick={handleLogout}>Выйти</button></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
