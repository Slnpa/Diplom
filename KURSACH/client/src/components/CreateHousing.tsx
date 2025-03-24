import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';  // Для доступа к данным Redux
import '../styles/CreateHousing.css';  // Импортируем стили

const CreateHousing: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    pricePerNight: '',
    categoryId: '', // Новый параметр для категории
    criteria: [] as string[], // Новый параметр для критериев (массив)
  });
  const [image, setImage] = useState<File | null>(null); // для хранения выбранного изображения
  const [categories, setCategories] = useState<any[]>([]); // Состояние для списка категорий
  const [criteriaList, setCriteriaList] = useState<any[]>([]); // Состояние для списка критериев

  // Получаем данные пользователя из Redux
  const user = useSelector((state: any) => state.user);

  // Получаем ID владельца из данных пользователя
  const ownerId = user.userId;

  // Проверяем, является ли пользователь администратором или владельцем
  const canCreateHousing = user.role === 'ADMIN' || user.role === 'OWNER';

  // Загрузка категорий и критериев с сервера
  useEffect(() => {
    // Загрузка категорий
    fetch('http://localhost:3000/admin/categories')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Ошибка при загрузке категорий:', error));

    // Загрузка критериев
    fetch('http://localhost:3000/admin/criteria')
      .then(response => response.json())
      .then(data => setCriteriaList(data))
      .catch(error => console.error('Ошибка при загрузке критериев:', error));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      categoryId: e.target.value,
    });
  };

  const handleCriteriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
  
    setFormData(prevFormData => {
      const updatedCriteria = checked
        ? [...prevFormData.criteria, value]  // Добавляем ID критерия в массив
        : prevFormData.criteria.filter(criterionId => criterionId !== value); // Убираем ID критерия из массива
        
      return {
        ...prevFormData,
        criteria: updatedCriteria,
      };
    });
  };
  

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]); // сохраняем выбранный файл
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('pricePerNight', formData.pricePerNight);
    formDataToSend.append('ownerId', ownerId.toString()); // Используем ID владельца из контекста
    formDataToSend.append('categoryId', formData.categoryId); // Добавляем categoryId

    if (formData.criteria.length > 0) {
      formData.criteria.forEach(criterionId => {
        formDataToSend.append('criteria[]', criterionId); // Добавляем каждый ID критерия
      });
    }

    if (image) {
      formDataToSend.append('image', image); // добавляем изображение
    }
  
    formDataToSend.forEach((value, key) => {
      console.log(key, value); // выводим ключ и значение
    });

    try {
      const response = await fetch('http://localhost:3000/housing', {
        method: 'POST',
        body: formDataToSend,
      });
      if (response.ok) {
        alert('Жилье успешно создано!');
        const newProperty = await response.json();
        console.log(newProperty.imageUrl);
        setFormData({
          name: '',
          description: '',
          location: '',
          pricePerNight: '',
          categoryId: '',
          criteria: [],
        });
        setImage(null);
      } else {
        alert('Ошибка при создании жилья');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании жилья');
    }
  };

  if (!canCreateHousing) {
    return <p className="error-message">У вас нет прав для создания жилья. Только администратор или владелец может создать жилье.</p>;
  }

  return (
    <div className="create-housing-container">
      <h2 className="create-housing-header">Создать новое жилье</h2>
      <form onSubmit={handleSubmit} className="create-housing-form">
        <input
          name="name"
          placeholder="Название"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Описание"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder="Местоположение"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <input
          name="pricePerNight"
          type="number"
          placeholder="Цена за ночь"
          value={formData.pricePerNight}
          onChange={handleChange}
          required
        />
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Выберите категорию</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <div>
            <p>Выберите критерии:</p>
            {criteriaList.map(criterion => (
              <label key={criterion.id}>
                <input
                  type="checkbox"
                  value={criterion.id.toString()} // Преобразуем в строку, если id числовой
                  checked={formData.criteria.includes(criterion.id.toString())} // Убедитесь, что это строка
                  onChange={handleCriteriaChange}
                />
                {criterion.name}
              </label>
            ))}
          </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        <button type="submit">Создать</button>
      </form>
    </div>
  );
};

export default CreateHousing;
