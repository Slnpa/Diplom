import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../styles/UserChatsComponent.css';  // Подключаем CSS

interface Chat {
  id: number;
  ownerId: number;
  userId: number;
  propertyId: number;
  messages: Message[];
  user: {
    id: number;
    role: string;
    login: string;
    email: string;
  };
  owner: {
    id: number;
    role: string;
    login: string;
    email: string;
  };
  property: {
    name: string;
  }
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

const UserChatsComponent: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useSelector((state: any) => state.user.userId);
  const navigate = useNavigate();

  // Получение списка чатов
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3000/api/chats/${userId}`);
        if (!response.ok) {
          throw new Error(`Error fetching chats: ${response.statusText}`);
        }
        const data: Chat[] = await response.json();
        setChats(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userId]);

  // Переход к жилью и продолжение чата
  const handleChatClick = (chat: Chat) => {
    navigate(`/property/${chat.propertyId}`, { state: { chatId: chat.id } });
  };

  return (
    <div className="container">
      <h1 className="header">Ваши чаты</h1>

      {/* Отображение ошибки */}
      {error && <p className="error">Error: {error}</p>}

      {/* Список чатов */}
      <div>
        {loading ? (
          <p className="loading">Загрузка чатов...</p>
        ) : (
          <ul className="chatList">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <li key={chat.id} className="chatItem" onClick={() => handleChatClick(chat)}>
                  <span className="chatText">
                    Чат с {chat.owner?.login && Number(chat.userId) === Number(userId)
                      ? chat.owner.login
                      : chat.user?.login} о жилье "{chat.property.name}"
                  </span>
                  <button className="button">Перейти к жилью</button>
                </li>
              ))
            ) : (
              <p className="noChats">Нет доступных чатов</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserChatsComponent;
