import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../styles/CreateHousing.css';

const CreateHousing: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    pricePerNight: '',
    categoryId: '',
    criteria: [] as string[],
  });

  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]); // 🔹 Новый стейт для документов
  const [categories, setCategories] = useState<any[]>([]);
  const [criteriaList, setCriteriaList] = useState<any[]>([]);

  const user = useSelector((state: any) => state.user);
  const ownerId = user.userId;
  const canCreateHousing = user.role === 'ADMIN' || user.role === 'OWNER';

  useEffect(() => {
    fetch('http://localhost:3000/admin/categories')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Ошибка при загрузке категорий:', error));

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
        ? [...prevFormData.criteria, value]
        : prevFormData.criteria.filter(criterionId => criterionId !== value);
      return {
        ...prevFormData,
        criteria: updatedCriteria,
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('pricePerNight', formData.pricePerNight);
    formDataToSend.append('ownerId', ownerId.toString());
    formDataToSend.append('categoryId', formData.categoryId);

    if (formData.criteria.length > 0) {
      formData.criteria.forEach(criterionId => {
        formDataToSend.append('criteria[]', criterionId);
      });
    }

    if (images.length > 0) {
      images.forEach(file => {
        formDataToSend.append('images', file);
      });
    }

    if (documents.length > 0) {
      documents.forEach(file => {
        formDataToSend.append('housingDocuments', file);
      });
    }

    try {
      const response = await fetch('http://localhost:3000/housing', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        alert('Жилье успешно создано!');
        const newProperty = await response.json();
        console.log(newProperty);

        setFormData({
          name: '',
          description: '',
          location: '',
          pricePerNight: '',
          categoryId: '',
          criteria: [],
        });
        setImages([]);
        setDocuments([]);
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
                value={criterion.id.toString()}
                checked={formData.criteria.includes(criterion.id.toString())}
                onChange={handleCriteriaChange}
              />
              {criterion.name}
            </label>
          ))}
        </div>

        <p>Изображения жилья:</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          required
        />

        <p>Документы (сканы, подтверждения и т.п.):</p>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple
          onChange={handleDocumentsChange}
        />

        <button type="submit">Создать</button>
      </form>
    </div>
  );
};

export default CreateHousing;
