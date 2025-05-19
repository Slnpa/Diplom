import React, { useEffect, useState } from 'react';

const PropertyModeration: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/admin/properties/pending')
      .then(res => res.json())
      .then(data => setProperties(data))
      .catch(console.error);
  }, []);

  const handleDecision = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch(`http://localhost:3000/admin/properties/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      setProperties(prev => prev.filter(prop => prop.id !== id));
    } catch (err) {
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleDownload = (fileName: string) => {
    // Логируем перед скачиванием
    console.log(`Попытка скачать файл с именем: ${fileName}`);
    
    if (!fileName) {
      console.error('Ошибка: имя файла не передано!');
      return;
    }

    const downloadUrl = `http://localhost:3000/uploads/housingDocuments/${fileName}`;
    console.log(`URL для скачивания: ${downloadUrl}`);
    // Это инициирует скачивание
    window.open(downloadUrl, '_blank');
  };

  return (
    <div>
      <h2>Ожидающие модерации</h2>
      {properties.map((property) => (
        <div key={property.id} className="moderation-item" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
          <h3>{property.name}</h3>
          <p>{property.description}</p>

          {property.documents?.length > 0 && (
            <div>
              <strong>Документы:</strong>
              <ul>
                {property.documents.map((doc: any) => {
                  // Логируем каждое имя документа
                  console.log(`Документ: ${doc.fileName}, оригинальное имя: ${doc.originalName}`);

                  return (
                    <li key={doc.id}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(doc.fileName); // Вызываем обработчик для скачивания
                        }}
                      >
                        📎 {doc.originalName || doc.fileName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <button onClick={() => handleDecision(property.id, 'APPROVED')}>✅ Одобрить</button>
          <button className='reject-button' onClick={() => handleDecision(property.id, 'REJECTED')}>❌ Отклонить</button>
        </div>
      ))}
    </div>
  );
};

export default PropertyModeration;
