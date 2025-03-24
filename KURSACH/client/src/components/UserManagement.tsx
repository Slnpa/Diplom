import React, { useState, useEffect } from 'react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Загрузка всех пользователей
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

    fetchUsers();
  }, []);

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

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <span>{user.login} - {user.isActive ? 'Активен' : 'Заблокирован'}</span>
            <button onClick={() => toggleStatus(user.id, user.isActive)}>
              {user.isActive ? 'Заблокировать' : 'Разблокировать'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
