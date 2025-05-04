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
  images: { imageUrl: string }[];
  owner: {
    login: string;
    email: string;
    id: number;
  };
  category: {
    name: string;
  };
  criteria: {
    criterion: {
      id: number;
      name: string;
    };
  }[];
}

interface Category {
  name: string;
}

interface Criterion {
  id: number;
  name: string;
}

const Catalog: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<string>('price');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const userRole = useSelector((state: any) => state.user.role);
  const userId = useSelector((state: any) => state.user.userId);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, critRes] = await Promise.all([
          fetch('http://localhost:3000/admin/categories'),
          fetch('http://localhost:3000/admin/criteria'),
        ]);
        const [catData, critData] = await Promise.all([
          catRes.json(),
          critRes.json(),
        ]);
        setCategories(catData);
        setCriteria(critData);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };

    const fetchCatalog = async () => {
      try {
        let url = 'http://localhost:3000/catalog';
        if (userId) {
          url += `?userRole=${userRole}&userId=${userId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error('Ошибка при получении каталога:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          alert('Ошибка при удалении жилья');
        }
      } catch (error) {
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

  const handleCriterionToggle = (id: number) => {
    setSelectedCriteria((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setSelectedCriteria([]);
    setSortType('price');
  };

  const filteredProperties = [...properties]
    .filter((property) => {
      if (filterCategory && property.category.name !== filterCategory) return false;
      if (
        searchQuery &&
        !property.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) return false;

      if (selectedCriteria.length > 0) {
        const propertyCriterionIds = property.criteria.map((c) => c.criterion.id);
        return selectedCriteria.every((cid) => propertyCriterionIds.includes(cid));
      }

      return true;
    })
    .sort((a, b) => {
      if (sortType === 'price') return a.pricePerNight - b.pricePerNight;
      return a.name.localeCompare(b.name);
    });

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="catalog-container">
      {userRole === 'OWNER' && (
        <div className="add-housing-container">
          <button onClick={handleAddHousing} className="add-housing-button">
            Добавить жилье
          </button>
        </div>
      )}
      <div className="content-wrapper">
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
            <label>Фильтр по категории: </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">Все</option>
              {categories.map((category, index) => (
                <option key={index} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="criteria-container">
            <label>Критерии:</label>
            <div className="criteria-checkboxes">
              {criteria.map((crit) => (
                <label key={crit.id} className="criterion-label">
                  <input
                    type="checkbox"
                    value={crit.id}
                    checked={selectedCriteria.includes(crit.id)}
                    onChange={() => handleCriterionToggle(crit.id)}
                  />
                  {crit.name}
                </label>
              ))}
            </div>
          </div>

          <div className="sort-container">
            <label>Сортировка: </label>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="sort-select"
            >
              <option value="price">По цене</option>
              <option value="alphabet">По алфавиту</option>
            </select>
          </div>

          <div className="reset-container">
            <button onClick={handleResetFilters} className="reset-button">
              Сбросить фильтры
            </button>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <p>Жилье не найдено</p>
        ) : (
          <ul className="property-list">
            {filteredProperties.map((property) => (
              <li
                key={property.id}
                className="property-card"
                onClick={() => handlePropertyClick(property.id)}
              >
                <img
                  src={`http://localhost:3000${property.images[0]?.imageUrl}`}
                  alt={property.name}
                  className="property-image"
                />
                <h2>{property.name}</h2>
                <p>{property.description}</p>
                <p>Местоположение: {property.location}</p>
                <p>Цена за ночь: {property.pricePerNight} руб.</p>
                <p>Категория: {property.category.name}</p>
                <p>
                  Критерии:{' '}
                  {Array.isArray(property.criteria)
                    ? property.criteria.map((c) => c.criterion.name).join(', ')
                    : '—'}
                </p>
                <div>
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
    </div>
  );
};

export default Catalog;