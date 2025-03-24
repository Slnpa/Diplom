import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../styles/Reviews.css'; // Подключаем стили

interface Review {
  id: number;
  user: {
    id: number;  // Добавляем поле id для пользователя
    login: string;
  };
  rating: number;
  comment: string;
}

interface ReviewsProps {
  propertyId: number; // Теперь propertyId передается как пропс
  isConfirmed: boolean; // Статус подтверждения бронирования
}

const Reviews: React.FC<ReviewsProps> = ({ propertyId, isConfirmed }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 1, comment: '' });

  const userId = useSelector((state: any) => state.user.userId);
  const userRole = useSelector((state: any) => state.user.role); // Получаем роль пользователя

  // Функция для загрузки отзывов с сервера
  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:3000/property/${propertyId}/reviews`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить отзывы');
      }
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!propertyId) return;
    fetchReviews();
  }, [propertyId, userId]);

  // Обрабатываем логику для установки отзыва пользователя, если он существует
  useEffect(() => {
    const userReview = reviews.find((review) => review.user.id == userId);
    if (userReview) {
      // Если отзыв есть, заполняем форму этими данными
      setNewReview({
        rating: userReview.rating,
        comment: userReview.comment,
      });
    }
  }, [reviews, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:3000/property/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          propertyId,
          userId,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при добавлении отзыва');
      }
      await fetchReviews(); // Обновляем отзывы с сервера
    } catch (err: any) {
      console.error(err);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="reviews-section">
      <h2>Отзывы</h2>
      {reviews.length === 0 ? (
        <p className="no-reviews">Отзывов пока нет</p>
      ) : (
        <ul className="reviews-list">
          {reviews.map((review) => (
            <li key={review.id} className="review-item">
              <div className="review-header">
                <strong>{review.user?.login}</strong>
                <div className="stars">{renderStars(review.rating)}</div>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {userRole !== 'ADMIN' && userRole && userRole !== 'OWNER' && isConfirmed && (
        <form onSubmit={handleSubmit} className="review-form">
          <h3>Добавить отзыв</h3>
          <label>
            Рейтинг:
            <select
              value={newReview.rating}
              onChange={(e) =>
                setNewReview({ ...newReview, rating: Number(e.target.value) })
              }
              className="rating-select"
            >
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </label>
          <label>
            Комментарий:
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              className="comment-textarea"
            />
          </label>
          <button type="submit" className="submit-button">
            Добавить отзыв
          </button>
        </form>
      )}
      {userRole === 'USER' && !isConfirmed && (
        <p>Вы можете оставить отзыв только после подтверждения бронирования.</p>
      )}
    </div>
  );
};

export default Reviews;
