import React, { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { setUserRole, setUserName, setUserId, setUserActiveStatus, setUserVerifiedStatus } from '../slices/userSlice';
import { decodeJwt } from 'jose';
import '../styles/Login.css';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);

        // Декодируем токен
        const decodedToken: any = decodeJwt(data.token);
        if (decodedToken) {
          const { role, userId, isActive, isVerified } = decodedToken;
          if(isActive===false) return setMessage('Ваш аккаунт заблокирован');
          // Сохраняем данные в localStorage и Redux
          if (role) {
            dispatch(setUserRole(role));
          }
          if (userId) {
            dispatch(setUserId(userId));
          }
          if (isActive !== undefined) {
            dispatch(setUserActiveStatus(isActive)); // Сохраняем статус активности
          }
          if (isVerified !== undefined) {
            dispatch(setUserVerifiedStatus(isVerified)); // Сохраняем статус верификации
            localStorage.setItem('isVerified', String(isVerified)); // Сохраняем в localStorage
          }
        }

        dispatch(setUserName(login)); // Обновляем имя в Redux
        setMessage('Авторизация успешна');

        // Перенаправление
        if (decodedToken.isActive === false) {
          setMessage('Ваш аккаунт заблокирован');
        } else if (decodedToken.isVerified === false) {
          setMessage('Ваш аккаунт не верифицирован');
        } else {
          window.location.href = '/catalog';
        }
      } else {
        setMessage(data.message || 'Ошибка при авторизации');
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      setMessage('Ошибка при авторизации');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-header">Вход</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          className="input-field"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-field"
        />
        <button type="submit" className="submit-button">Войти</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Login;
