import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/EditProperty.css';

interface Property {
  id: number;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  category: { id: number, name: string };
  criteria: { id: number, name: string }[];
  images: PropertyImage[]; // Изменяем тип на массив изображений
}
interface PropertyImage {
  id: number;
  imageUrl: string;
}
const EditProperty: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Для хранения новых изображений
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<number[]>([]);
  const [criteriaList, setCriteriaList] = useState<{ id: number, name: string }[]>([]);
  const [message, setMessage] = useState('');
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]); // Список удалённых изображений

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`http://localhost:3000/property/${id}`);
        const data = await response.json();
        setProperty(data);
        setName(data.name);
        setDescription(data.description);
        setLocation(data.location);
        setPricePerNight(data.pricePerNight.toString());
        setSelectedCategory(data.category.id);
        setSelectedCriteria(data.criteria.map((criterion: { id: number }) => criterion.id));
      } catch (error) {
        console.error('Ошибка при загрузке данных жилья:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/admin/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
      }
    };

    const fetchCriteria = async () => {
      try {
        const response = await fetch('http://localhost:3000/admin/criteria');
        const data = await response.json();
        setCriteriaList(data);
      } catch (error) {
        console.error('Ошибка при загрузке критериев:', error);
      }
    };

    fetchProperty();
    fetchCategories();
    fetchCriteria();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('pricePerNight', pricePerNight);
    formData.append('categoryId', String(selectedCategory));
    formData.append('criteria', JSON.stringify(selectedCriteria));
    formData.append('imageIdsToDelete', JSON.stringify(imagesToDelete)); // Добавляем изображения для удаления

    // Добавляем новые изображения
    imageFiles.forEach(file => {
      formData.append('images', file); // Используем ключ 'images' для добавления новых изображений
    });

    try {
      const response = await fetch(`http://localhost:3000/property/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      formData.forEach((value, key) => {
        if (value instanceof File) {
          console.log(`${key}:`, value.name);
        } else {
          console.log(`${key}:`, value);
        }
      });

      if (response.ok) {
        setMessage('Жилье успешно обновлено!');
        navigate(`/property/${id}`);
      } else {
        const data = await response.json();
        setMessage(data.message || 'Ошибка при обновлении жилья');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
      setMessage('Ошибка при обновлении жилья');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        setImageFiles(selectedFiles); // сохраняем сразу все выбранные файлы
      }
    };

  const handleDeleteImage = (imageId: number) => {
    setImagesToDelete((prev) => [...prev, imageId]); // Добавляем ID изображения в список на удаление
  };

  if (!property || !categories.length || !criteriaList.length) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="edit-property">
      <h2>Редактировать жилье</h2>
      <form onSubmit={handleSubmit} className="property-form" encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="name">Название</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Местоположение</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pricePerNight">Цена за ночь</label>
          <input
            id="pricePerNight"
            type="number"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            required
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="category">Категория</label>
          <select
            id="category"
            value={selectedCategory ?? ''}
            onChange={(e) => setSelectedCategory(Number(e.target.value))}
            required
            className="form-control"
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Критерии</label>
          <div className="criteria-list">
            {criteriaList.map((criterion) => (
              <div key={criterion.id} className="form-check">
                <input
                  type="checkbox"
                  id={`criterion-${criterion.id}`}
                  checked={selectedCriteria.includes(criterion.id)}
                  onChange={() => {
                    if (selectedCriteria.includes(criterion.id)) {
                      setSelectedCriteria(selectedCriteria.filter((id) => id !== criterion.id));
                    } else {
                      setSelectedCriteria([...selectedCriteria, criterion.id]);
                    }
                  }}
                  className="form-check-input"
                />
                <label htmlFor={`criterion-${criterion.id}`} className="form-check-label">
                  {criterion.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="image">Изображения</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="form-control"
          />
<div className="current-images">
  {property.images.map((image) => {
    const isMarkedForDeletion = imagesToDelete.includes(image.id);

    return (
      <div key={image.id} style={{ position: 'relative', display: 'inline-block', margin: '10px' }}>
        <img 
          src={`http://localhost:3000${image.imageUrl}`} 
          alt="Текущее изображение" 
          width="100"
          style={{
            opacity: isMarkedForDeletion ? 0.5 : 1,
            border: isMarkedForDeletion ? '2px solid red' : 'none',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        />
        {isMarkedForDeletion ? (
          <div style={{ color: 'red', marginTop: '5px', textAlign: 'center' }}>Будет удалено</div>
        ) : (
          <button
            type="button"
            onClick={() => handleDeleteImage(image.id)}
            style={{ display: 'block', marginTop: '5px' }}
          >
            Удалить
          </button>
        )}
      </div>
    );
  })}
</div>



        </div>
        <button type="submit" className="btn-submit">Сохранить</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default EditProperty;
