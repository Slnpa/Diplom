import React, { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { decodeJwt } from 'jose';
import { setUserRole, setUserName, setUserId, setUserActiveStatus } from '../slices/userSlice';
import '../styles/Register.css';

const Register: React.FC = () => {
  const [login, setLogin] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<{ login?: string; email?: string; password?: string }>({});
  const dispatch = useDispatch();

  const validate = (): boolean => {
    const newErrors: { login?: string; email?: string; password?: string } = {};

    // Валидация логина
    if (login.trim().length < 3) {
      newErrors.login = 'Логин должен содержать не менее 3 символов';
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Введите корректный email';
    }

    // Валидация пароля
    if (password.length < 6) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов';
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = 'Пароль должен содержать буквы верхнего и нижнего регистра и цифры';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, email, password }),
      });

      const data = await response.json();
      setMessage(data.message || 'Регистрация успешна');

      if (data.token) {
        localStorage.setItem('token', data.token);

        // Декодируем токен
        const decodedToken: any = decodeJwt(data.token);

        // Обновляем данные в localStorage и Redux
        if (decodedToken) {
          const { role, userId, isActive } = decodedToken;
          if (role) {
            localStorage.setItem('role', role);
            dispatch(setUserRole(role));
          }
          if (userId) {
            localStorage.setItem('userId', userId.toString());
            dispatch(setUserId(userId.toString()));
          }
          if (isActive !== undefined) {
            localStorage.setItem('isActive', String(isActive));
            dispatch(setUserActiveStatus(isActive));
          }
          localStorage.setItem('userName', login);
          dispatch(setUserName(login));
        }

        // Перенаправление на каталог
        if (decodedToken.isActive === false) {
          setMessage('Ваш аккаунт заблокирован');
        } else {
          window.location.href = 'http://localhost:3001/catalog';
        }
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setMessage('Ошибка при регистрации');
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-header">Регистрация</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          className="input-field"
        />
        {errors.login && <p className="error-message">{errors.login}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-field"
        />
        {errors.email && <p className="error-message">{errors.email}</p>}

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-field"
        />
        {errors.password && <p className="error-message">{errors.password}</p>}

        <button type="submit" className="submit-button">Зарегистрироваться</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Register;
