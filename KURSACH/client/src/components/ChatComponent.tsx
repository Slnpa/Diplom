import React, { useState, useEffect } from 'react';
import '../styles/ChatComponent.css'
import { useSelector } from 'react-redux';

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
    ownerId: number;
  };
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

const ChatComponent: React.FC<{ ownerId: number; userRole: string; propertyId: number; ownerName: string }> = ({ ownerId, userRole, propertyId, ownerName }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chatExists, setChatExists] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const userId = useSelector((state: any) => state.user.userId);
  const [error, setError] = useState<string | null>(null);

  // Получение списка чатов по propertyId
// Обновление списка чатов каждые 1 секунду
useEffect(() => {
  const intervalId = setInterval(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/chats/${userId}/${propertyId}`);
        if (!response.ok) {
          throw new Error(`Error fetching chats: ${response.statusText}`);
        }
        const data: Chat[] = await response.json();
        setChats(data || []);

        const existingChat = data.find(
          (chat) =>
            (Number(chat.ownerId) === Number(ownerId) && Number(chat.userId) === Number(userId) && chat.propertyId === propertyId) ||
            (Number(chat.ownerId) === Number(userId) && Number(chat.userId) === Number(ownerId) && chat.propertyId === propertyId)
        );
        setChatExists(!!existingChat);

        if (existingChat) {
          setCurrentChat(existingChat);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchChats();
  }, 1000); // Запуск каждые 1000 мс

  return () => clearInterval(intervalId); // Очистка интервала при размонтировании
}, [userId, ownerId, propertyId]);


  // Создание нового чата
  const createChat = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId,
          userId,
          propertyId,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error creating chat: ${response.statusText}`);
      }
  
      const newChat = await response.json();
  
      // Заполнение данных о владельце и пользователе вручную
      const updatedChat = {
        ...newChat,
        owner: {
          id: ownerId,
          role: 'OWNER',
          login: ownerName,
          email: '', // Добавьте email, если он известен
        },
        user: {
          id: userId,
          role: 'USER',
          login: 'Вы', // Вы можете указать ваше имя пользователя здесь
          email: '', // Добавьте email, если он известен
        },
      };
  
      // Обновление состояния чатов и текущего чата
      setChats((prevChats) => [...prevChats, updatedChat]);
      setCurrentChat(updatedChat);
      setChatExists(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  
  // Обновление сообщений текущего чата
  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/messages/${chatId}`);
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.statusText}`);
      }
      const messages: Message[] = await response.json();
      setCurrentChat((prevChat) => {
        if (prevChat) {
          return { ...prevChat, messages };
        }
        return prevChat;
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Счётчик для обновления сообщений
  useEffect(() => {
    if (currentChat) {
      const intervalId = setInterval(() => {
        fetchMessages(currentChat.id);
      }, 1000);

      return () => clearInterval(intervalId); // Очистка интервала при размонтировании
    }
  }, [currentChat]);

  // Отправка сообщения
  const sendMessage = () => {
    if (currentChat && message.trim()) {
      setError(null);
      fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: currentChat.id,
          senderId: userId,
          content: message,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error sending message: ${response.statusText}`);
          }
          return response.json();
        })
        .then((newMessage) => {
          // Обновляем чат, убедившись, что сообщения всегда массив
          setCurrentChat((prevChat) => {
            if (prevChat) {
              return {
                ...prevChat,
                messages: Array.isArray(prevChat.messages) ? [...prevChat.messages, newMessage] : [newMessage],
              };
            }
            return prevChat; // Если чата нет, возвращаем предыдущий стейт
          });
          setMessage('');
        })
        .catch((err) => setError((err as Error).message));
    }
  };

  return (
    <div className="chat-component">
      <h1 className="chat-component__title">Чаты</h1>
      {error && <p className="chat-component__error">Error: {error}</p>}
      <div>
        {loading ? (
          <p>Loading chats...</p>
        ) : (
          <ul className="chat-component__list">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <li key={chat.id} onClick={() => setCurrentChat(chat)} className="chat-component__item">
                  Чат с{' '}
                  {chat.owner?.login && Number(chat.userId) === Number(userId)
                    ? `владельцем ${chat.owner.login}`
                    : chat.user?.login && `пользователем ${chat.user.login}`}
                </li>
              ))
            ) : (
              userRole === 'USER' && <p>Нет доступных чатов. Начни новый чат!</p>
            )}
          </ul>
        )}
      </div>

      {!currentChat && userRole !== 'OWNER' && !chatExists && Number(ownerId) !== Number(userId) && (
        <div>
          <button
            onClick={createChat}
            disabled={loading}
            className="chat-component__button"
          >
            {loading ? 'Создание чата...' : 'Начать чат'}
          </button>
        </div>
      )}

      {currentChat && (
        <div>
          <h2 className="chat-component__title">Чат</h2>
          <div className="chat-component__messages">
            {currentChat?.messages?.length > 0 ? (
              currentChat.messages.map((msg) => (
                <p key={msg.id} className="chat-component__message">
                  <b>
                    {Number(msg.senderId) === Number(userId)
                      ? 'Вы'
                      : Number(msg.senderId) === Number(currentChat.owner?.id)
                      ? currentChat.owner?.login
                      : currentChat.user?.login}
                  </b>{' '}
                  {msg.content}
                </p>
              ))
            ) : (
              <p>Сообщений пока нет. Начни диалог!</p>
            )}
          </div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напишите свое сообщение..."
            className="chat-component__input"
          />
          <button
            onClick={sendMessage}
            className="chat-component__button"
          >
            Отправить
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
