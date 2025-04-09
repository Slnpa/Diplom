import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUserRole, logout, setUserVerifiedStatus } from '../slices/userSlice'; // добавим action для setUserVerified
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Данные пользователя из Redux
  const { role: userRole, userName, userId, isVerified } = useSelector((state: any) => state.user);

  const [pendingBookings, setPendingBookings] = useState<number>(0); // Количество ожидающих бронирований
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false); // Флаг для отображения модального окна
  const [documents, setDocuments] = useState<File | null>(null); // Документы для загрузки

  // Функция для получения актуального статуса верификации
  const fetchVerificationStatus = useCallback(async () => {
    if (userId) {
      try {
        const response = await fetch(`http://localhost:3000/users/${userId}/verify-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(setUserVerifiedStatus(data.isVerified)); // Обновляем статус верификации в Redux
        } else {
          console.error('Ошибка при получении статуса верификации');
        }
      } catch (error) {
        console.error('Ошибка при получении статуса верификации:', error);
      }
    }
  }, [userId, dispatch]);

  // Выполнение запроса при изменении userId
  useEffect(() => {
    if (userId) {
      fetchVerificationStatus();
    }
  }, [fetchVerificationStatus, userId]);

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

  // Открытие модального окна для верификации
  const openVerificationModal = () => {
    setShowVerificationModal(true);
  };

  // Закрытие модального окна
  const closeVerificationModal = () => {
    setShowVerificationModal(false);
  };

  // Обработка выбора документа
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(e.target.files[0]);
    }
  };

  // Отправка документов для верификации
  const handleUploadDocuments = async () => {
    if (!documents || !userId) {
      alert('Пожалуйста, загрузите документы для верификации');
      return;
    }

    const formData = new FormData();
    formData.append('documents', documents);

    try {
      const response = await fetch(`http://localhost:3000/users/${userId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert('Документы успешно загружены. Ожидайте верификации.');
        closeVerificationModal();
      } else {
        alert(data.message || 'Ошибка при загрузке документов');
      }
    } catch (error) {
      console.error('Ошибка при загрузке документов:', error);
      alert('Ошибка при загрузке документов');
    }
  };

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
            {userRole === 'USER' && !isVerified && (
              <>
                <li>
                  <button onClick={openVerificationModal}>Пройти верификацию</button>
                </li>
              </>
            )}
            {userRole === 'USER' && isVerified && (
              <>
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

      {/* Модальное окно для верификации */}
      {showVerificationModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Загрузите документы для верификации</h3>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUploadDocuments}>Загрузить документы</button>
            <button onClick={closeVerificationModal}>Закрыть</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
