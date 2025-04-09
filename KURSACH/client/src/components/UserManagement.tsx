import React, { useState, useEffect } from 'react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Функция для загрузки списка пользователей
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/users');
      if (!response.ok) {
        throw new Error('Не удалось загрузить пользователей');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
    }
  };

  useEffect(() => {
    // Изначальная загрузка пользователей
    fetchUsers();
  }, []);

  // Подтверждение пользователя
  const handleVerify = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/admin/verify-user/${userId}`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Ошибка при подтверждении пользователя');
      }

      // Повторная загрузка пользователей, чтобы отобразить актуальное состояние
      await fetchUsers(); // Заново загружаем список

    } catch (err) {
      setError('Не удалось подтвердить пользователя');
    }
  };

  // Изменение статуса активности пользователя
  const toggleStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!response.ok) {
        throw new Error('Ошибка при изменении статуса');
      }
      const updatedUser = await response.json();
      setUsers((prev) =>
        prev.map((user) =>
          user.id === updatedUser.id ? { ...user, isActive: updatedUser.isActive } : user
        )
      );
    } catch (err) {
      setError('Не удалось изменить статус');
    }
  };

  // Функция для скачивания документа
  const handleDownloadDocument = (documentUrl: string) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3000/${documentUrl}`;
    link.download = documentUrl.split('/').pop() || 'document'; // Скачивание документа
    document.body.appendChild(link); // Добавляем ссылку в DOM
    link.click();
    document.body.removeChild(link); // Удаляем ссылку из DOM
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Список пользователей</h2>
      <table>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Почта</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Документ</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.login}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isVerified ? 'Подтвержден' : 'Не подтвержден'}</td>
              <td>
                {user.documentUrl && (
                  <button onClick={() => handleDownloadDocument(user.documentUrl)}>
                    Скачать документ
                  </button>
                )}
              </td>
              <td>
                {!user.isVerified && (
                  <button onClick={() => handleVerify(user.id)} disabled={user.isVerified}>
                    Подтвердить
                  </button>
                )}
                <button onClick={() => toggleStatus(user.id, user.isActive)}>
                  {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
