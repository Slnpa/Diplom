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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Для предварительного просмотра
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]); // Для отображения имен документов
  const [categories, setCategories] = useState<any[]>([]);
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [criteriaSearch, setCriteriaSearch] = useState<string>('');

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
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newDocuments = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newDocuments]);
      setDocumentNames(prev => [...prev, ...newDocuments.map(file => file.name)]);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    setDocumentNames(prev => prev.filter((_, i) => i !== index));
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
        setImagePreviews([]);
        setDocuments([]);
        setDocumentNames([]);
        setCriteriaSearch('');
      } else {
        alert('Ошибка при создании жилья');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании жилья');
    }
  };

  const filteredCriteria = criteriaList.filter(criterion =>
    criterion.name.toLowerCase().includes(criteriaSearch.toLowerCase())
  );

  if (!canCreateHousing) {
    return <p className="error-message">У вас нет прав для создания жилья. Только администратор или владелец может создать жилье.</p>;
  }

  return (
    <div className="create-housing-container">
      <h2 className="create-housing-header">Создать новое жилье</h2>
      <form onSubmit={handleSubmit} className="create-housing-form">
        <div className="form-group">
          <label>Название:</label>
          <input
            name="name"
            placeholder="Название жилья"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Описание:</label>
          <textarea
            name="description"
            placeholder="Описание жилья"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Местоположение:</label>
          <input
            name="location"
            placeholder="Город, адрес"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Цена за ночь:</label>
          <input
            name="pricePerNight"
            type="number"
            placeholder="Цена в рублях"
            value={formData.pricePerNight}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Категория:</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleCategoryChange}
            required
            className="category-select"
          >
            <option value="">Выберите категорию</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group criteria-container">
          <label>Критерии:</label>
          <input
            type="text"
            placeholder="Поиск по критериям"
            value={criteriaSearch}
            onChange={(e) => setCriteriaSearch(e.target.value)}
            className="criteria-search-input"
          />
          <div className="criteria-checkboxes">
            {filteredCriteria.map(criterion => (
              <label key={criterion.id} className="criterion-label">
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
        </div>

        <div className="form-group">
          <label>Изображения жилья:</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
          />
          {imagePreviews.length > 0 && (
            <div className="image-preview-container">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Документы (PDF, DOC, изображения) подтверждающие жилье:</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
            onChange={handleDocumentsChange}
          />
          {documentNames.length > 0 && (
            <div className="document-preview-container">
              {documentNames.map((name, index) => (
                <div key={index} className="document-preview">
                  <span className="document-name">{name}</span>
                  <button
                    type="button"
                    className="remove-document-button"
                    onClick={() => handleRemoveDocument(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="submit-button">Создать</button>
      </form>
    </div>
  );
};

export default CreateHousing;