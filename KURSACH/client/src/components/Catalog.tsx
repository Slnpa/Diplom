import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../styles/Catalog.css';

interface Property {
  id: number;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  imageUrl: string;
  owner: {
    login: string;
    email: string;
    id: number;
  };
  category: {
    name: string;
  };
}

interface Category {
  name: string;
}

const Catalog: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<string>('price');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const userRole = useSelector((state: any) => state.user.role);
  const userId = useSelector((state: any) => state.user.userId);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/admin/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
      }
    };

    const fetchCatalog = async () => {
      try {
        let url = 'http://localhost:3000/catalog';
        if (userId) {
          url = `http://localhost:3000/catalog?userRole=${userRole}&userId=${userId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
          console.error('Полученные данные не являются массивом:', data);
          setProperties([]);
        }
      } catch (error) {
        console.error('Ошибка при получении каталога:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchCatalog();
  }, [userRole, userId]);

  const handleDelete = async (id: number) => {
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      alert('Вы должны быть владельцем жилья для удаления!');
      return;
    }

    if (window.confirm('Вы уверены, что хотите удалить это жилье?')) {
      try {
        const response = await fetch(`http://localhost:3000/catalog/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          setProperties(properties.filter((property) => property.id !== id));
          alert('Жилье успешно удалено');
        } else {
          const errorData = await response.json();
          console.error('Ошибка при удалении жилья:', errorData);
          alert('Ошибка при удалении жилья');
        }
      } catch (error) {
        console.error('Ошибка при удалении жилья:', error);
        alert('Ошибка при удалении жилья');
      }
    }
  };

  const handleAddHousing = () => {
    navigate('/create');
  };

  const handlePropertyClick = (id: number) => {
    navigate(`/property/${id}`);
  };

  const sortedProperties = [...properties]
    .sort((a, b) => {
      if (sortType === 'price') {
        return a.pricePerNight - b.pricePerNight;
      }
      return a.name.localeCompare(b.name);
    })
    .filter((property) => {
      if (filterCategory && property.category.name !== filterCategory) {
        return false;
      }
      if (property.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      return false;
    });

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="catalog-container">
      <h1 className="catalog-header">Каталог жилья</h1>

      {(userRole === 'OWNER') && (
        <button onClick={handleAddHousing} className="add-housing-button">
          Добавить жилье
        </button>
      )}

      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Поиск по названию или описанию"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <label>Фильтровать по категории: </label>
          <select onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
            <option value="">Все</option>
            {categories.map((category, index) => (
              <option key={index} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="sort-container">
          <label>Сортировка: </label>
          <select onChange={(e) => setSortType(e.target.value)} className="sort-select">
            <option value="price">По цене</option>
            <option value="alphabet">По алфавиту</option>
          </select>
        </div>
      </div>

      {sortedProperties.length === 0 ? (
        <p>Жилье не найдено</p>
      ) : (
        <ul className="property-list">
          {sortedProperties.map((property) => (
            <li
              key={property.id}
              className="property-card"
              onClick={() => handlePropertyClick(property.id)}
            >
              <img
                src={`http://localhost:3000${property.imageUrl}`}
                alt={property.name}
                className="property-image"
              />
              <h2 className="property-name">{property.name}</h2>
              <p className="property-description">{property.description}</p>
              <p className="property-location">Местоположение: {property.location}</p>
              <p className="property-price">Цена за ночь: {property.pricePerNight} руб.</p>
              <p className="property-category">Категория: {property.category.name}</p>
              <div className="owner-info">
                Владелец: {property.owner.login} ({property.owner.email})
              </div>
              {(userRole === 'ADMIN' || String(userId) === String(property.owner.id)) && (
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(property.id);
                  }}
                >
                  Удалить жилье
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Catalog;
