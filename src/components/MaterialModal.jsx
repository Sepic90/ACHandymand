import React, { useState, useEffect } from 'react';

function MaterialModal({ material, suppliers, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'stk',
    category: '',
    defaultSupplierId: '',
    defaultSupplierName: '',
    standardMarkup: '50'
  });

  const [errors, setErrors] = useState({});

  const units = ['stk', 'm', 'm²', 'm³', 'kg', 'liter', 'pose', 'rulle', 'palle'];
  const categories = ['Træ', 'Gips', 'El-materialer', 'VVS', 'Maling', 'Værktøj', 'Diverse'];

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        sku: material.sku || '',
        unit: material.unit || 'stk',
        category: material.category || '',
        defaultSupplierId: material.defaultSupplierId || '',
        defaultSupplierName: material.defaultSupplierName || '',
        standardMarkup: String(material.standardMarkup || 50)
      });
    }
  }, [material]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Update supplier name when supplier is selected
      if (name === 'defaultSupplierId' && value) {
        const supplier = suppliers.find(s => s.id === value);
        if (supplier) {
          newData.defaultSupplierName = supplier.name;
        }
      } else if (name === 'defaultSupplierId' && !value) {
        newData.defaultSupplierName = '';
      }

      return newData;
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Materiale navn er påkrævet (min. 2 tegn)';
    }

    if (!formData.unit) {
      newErrors.unit = 'Enhed er påkrævet';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori er påkrævet';
    }

    const markup = parseFloat(formData.standardMarkup);
    if (isNaN(markup) || markup < 0 || markup > 500) {
      newErrors.standardMarkup = 'Avance skal være mellem 0 og 500%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      const dataToSave = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        unit: formData.unit,
        category: formData.category,
        defaultSupplierId: formData.defaultSupplierId || null,
        defaultSupplierName: formData.defaultSupplierName,
        standardMarkup: parseFloat(formData.standardMarkup)
      };

      onSave(dataToSave);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content material-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{material ? 'Redigér Materiale' : 'Tilføj Materiale'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3 className="form-section-title">Grundoplysninger</h3>

            <div className="form-group">
              <label htmlFor="name">Materiale navn *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
                placeholder="F.eks. Gipsplader 13mm"
                autoFocus
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sku">Artikelnummer / Varenummer</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="F.eks. GP13-001"
              />
              <small className="form-hint">Leverandørens varenummer</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="unit">Enhed *</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className={errors.unit ? 'input-error' : ''}
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.unit && <span className="error-text">{errors.unit}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Kategori *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? 'input-error' : ''}
                >
                  <option value="">-- Vælg --</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Standard leverandør & prissætning</h3>

            <div className="form-group">
              <label htmlFor="defaultSupplierId">Standard leverandør</label>
              <select
                id="defaultSupplierId"
                name="defaultSupplierId"
                value={formData.defaultSupplierId}
                onChange={handleChange}
              >
                <option value="">-- Ingen standard --</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
              <small className="form-hint">
                Vælges automatisk når du tilføjer dette materiale til en sag
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="standardMarkup">Standard avance (%) *</label>
              <input
                type="text"
                id="standardMarkup"
                name="standardMarkup"
                value={formData.standardMarkup}
                onChange={handleChange}
                className={errors.standardMarkup ? 'input-error' : ''}
                placeholder="F.eks. 50"
              />
              {errors.standardMarkup && <span className="error-text">{errors.standardMarkup}</span>}
              <small className="form-hint">
                Bruges til at beregne salgspris automatisk (f.eks. 50% = indkøb * 1.5)
              </small>
            </div>

            {material && material.lastPurchasePrice && (
              <div className="info-box">
                <div className="info-box-title">Seneste indkøb</div>
                <div className="info-box-content">
                  <strong>Pris pr. enhed:</strong> {material.lastPurchasePrice.toFixed(2)} kr<br />
                  <strong>Dato:</strong> {new Date(material.lastPurchaseDate).toLocaleDateString('da-DK')}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {material ? 'Gem ændringer' : 'Tilføj materiale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaterialModal;