import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUserRole, setUserName, setUserId } from '../slices/userSlice';
import '../styles/UserSettings.css';

const UserSettings: React.FC = () => {
  const dispatch = useDispatch();

  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Вы не авторизованы');
      return;
    }

    if (password && !oldPassword) {
      setError('Для изменения пароля необходимо ввести старый пароль');
      return;
    }

    const requestData: any = {
      login,
      email,
      oldPassword,
    };

    if (password) {
      requestData.password = password;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Ошибка при обновлении информации');
        setSuccess(null);
        return;
      }

      const data = await response.json();
      setSuccess('Информация успешно обновлена');
      setError(null);
      dispatch(setUserName(data.user.login));
      dispatch(setUserRole(data.user.role));
      dispatch(setUserId(data.user.id));
    } catch (error) {
      setError('Ошибка при обновлении информации');
      setSuccess(null);
    }
  };

  return (
    <div className="user-settings">
      <h1>Настройки пользователя</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <label htmlFor="login" className="label">Логин</label>
          <input
            type="text"
            id="login"
            className="input"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Введите новый логин"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email" className="label">Email</label>
          <input
            type="email"
            id="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите новый email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="oldPassword" className="label">Старый пароль</label>
          <input
            type="password"
            id="oldPassword"
            className="input"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Введите старый пароль"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password" className="label">Новый пароль (если хотите изменить)</label>
          <input
            type="password"
            id="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите новый пароль"
          />
        </div>

        <button type="submit" className="button">Сохранить изменения</button>
      </form>
    </div>
  );
};

export default UserSettings;