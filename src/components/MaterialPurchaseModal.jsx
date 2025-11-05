import React, { useState, useEffect } from 'react';

function MaterialPurchaseModal({ 
  purchase, 
  project, 
  suppliers, 
  materials, 
  onSave, 
  onClose 
}) {
  const [formData, setFormData] = useState({
    date: '',
    materialName: '',
    materialId: null,
    sku: '',
    quantity: '',
    unit: 'stk',
    category: '',
    supplierId: '',
    supplierName: '',
    purchasePrice: '',
    sellingPrice: '',
    paymentMethod: 'Firmakort',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [autoCalculatePrice, setAutoCalculatePrice] = useState(true);
  const [defaultMarkup] = useState(50);

  const units = ['stk', 'm', 'm²', 'm³', 'kg', 'liter', 'pose', 'rulle', 'palle'];
  const categories = ['Træ', 'Gips', 'El-materialer', 'VVS', 'Maling', 'Værktøj', 'Diverse'];
  const paymentMethods = ['Firmakort', 'Faktura', 'Kontant', 'MobilePay'];

  useEffect(() => {
    if (purchase) {
      setFormData({
        date: purchase.date || '',
        materialName: purchase.materialName || '',
        materialId: purchase.materialId || null,
        sku: purchase.sku || '',
        quantity: String(purchase.quantity || ''),
        unit: purchase.unit || 'stk',
        category: purchase.category || '',
        supplierId: purchase.supplierId || '',
        supplierName: purchase.supplierName || '',
        purchasePrice: String(purchase.purchasePrice || ''),
        sellingPrice: String(purchase.sellingPrice || ''),
        paymentMethod: purchase.paymentMethod || 'Firmakort',
        notes: purchase.notes || ''
      });
      setAutoCalculatePrice(false);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: today
      }));
    }
  }, [purchase]);

  const parseDecimal = (str) => {
    if (!str) return 0;
    const normalized = String(str).replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const formatDecimal = (num) => {
    return String(num).replace('.', ',');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      if (name === 'materialId' && value) {
        const selectedMaterial = materials.find(m => m.id === value);
        if (selectedMaterial) {
          newData.materialName = selectedMaterial.name;
          newData.unit = selectedMaterial.unit;
          newData.category = selectedMaterial.category;
          newData.sku = selectedMaterial.sku || '';
          
          if (selectedMaterial.defaultSupplierId) {
            newData.supplierId = selectedMaterial.defaultSupplierId;
            const supplier = suppliers.find(s => s.id === selectedMaterial.defaultSupplierId);
            if (supplier) {
              newData.supplierName = supplier.name;
            }
          }
        }
      }

      if (name === 'supplierId' && value) {
        const supplier = suppliers.find(s => s.id === value);
        if (supplier) {
          newData.supplierName = supplier.name;
        }
      }

      if (name === 'purchasePrice' && autoCalculatePrice) {
        const purchasePrice = parseDecimal(value);
        if (purchasePrice > 0) {
          const markup = defaultMarkup / 100;
          const sellingPrice = purchasePrice * (1 + markup);
          newData.sellingPrice = formatDecimal(sellingPrice.toFixed(2));
        }
      }

      return newData;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSellingPriceChange = (e) => {
    setAutoCalculatePrice(false);
    handleChange(e);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Dato er påkrævet';
    }

    if (!formData.materialName || formData.materialName.trim().length < 2) {
      newErrors.materialName = 'Materiale navn er påkrævet';
    }

    const quantity = parseDecimal(formData.quantity);
    if (!formData.quantity || quantity <= 0) {
      newErrors.quantity = 'Antal skal være større end 0';
    }

    if (!formData.unit) {
      newErrors.unit = 'Enhed er påkrævet';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori er påkrævet';
    }

    if (!formData.supplierName || formData.supplierName.trim().length < 2) {
      newErrors.supplierName = 'Leverandør er påkrævet';
    }

    const purchasePrice = parseDecimal(formData.purchasePrice);
    if (!formData.purchasePrice || purchasePrice < 0) {
      newErrors.purchasePrice = 'Indkøbspris er påkrævet';
    }

    const sellingPrice = parseDecimal(formData.sellingPrice);
    if (!formData.sellingPrice || sellingPrice < 0) {
      newErrors.sellingPrice = 'Salgspris er påkrævet';
    }

    if (sellingPrice < purchasePrice) {
      newErrors.sellingPrice = 'Salgspris bør være højere end indkøbspris';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      const dataToSave = {
        caseId: project.id,
        caseNumber: project.projectNumber,
        caseName: project.name,
        date: formData.date,
        materialId: formData.materialId || null,
        materialName: formData.materialName.trim(),
        sku: formData.sku.trim(),
        quantity: parseDecimal(formData.quantity),
        unit: formData.unit,
        category: formData.category,
        supplierId: formData.supplierId || null,
        supplierName: formData.supplierName.trim(),
        purchasePrice: parseDecimal(formData.purchasePrice),
        sellingPrice: parseDecimal(formData.sellingPrice),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim()
      };

      onSave(dataToSave);
    }
  };

  const calculateMargin = () => {
    const purchase = parseDecimal(formData.purchasePrice);
    const selling = parseDecimal(formData.sellingPrice);
    if (purchase > 0) {
      const margin = ((selling - purchase) / purchase) * 100;
      return margin.toFixed(1);
    }
    return '0';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content material-purchase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{purchase ? 'Redigér Materiale' : 'Tilføj Materiale'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="date">Dato *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'input-error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <span className="error-text">{errors.date}</span>}
          </div>

          {materials.length > 0 && (
            <div className="form-group">
              <label htmlFor="materialId">Vælg fra katalog (valgfrit)</label>
              <select
                id="materialId"
                name="materialId"
                value={formData.materialId || ''}
                onChange={handleChange}
              >
                <option value="">-- Skriv nyt materiale --</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="materialName">Materiale *</label>
            <input
              type="text"
              id="materialName"
              name="materialName"
              value={formData.materialName}
              onChange={handleChange}
              className={errors.materialName ? 'input-error' : ''}
              placeholder="F.eks. Gipsplader 13mm"
            />
            {errors.materialName && <span className="error-text">{errors.materialName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="sku">Artikelnummer / Varenummer</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="F.eks. 123456"
            />
            <small className="form-hint">Leverandørens varenummer - hjælper med faktura-afstemning</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Antal *</label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={errors.quantity ? 'input-error' : ''}
                placeholder="F.eks. 15"
              />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>

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
              <option value="">-- Vælg kategori --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          {suppliers.length > 0 ? (
            <div className="form-group">
              <label htmlFor="supplierId">Leverandør *</label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className={errors.supplierName ? 'input-error' : ''}
              >
                <option value="">-- Vælg leverandør --</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
              {errors.supplierName && <span className="error-text">{errors.supplierName}</span>}
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="supplierName">Leverandør *</label>
              <input
                type="text"
                id="supplierName"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                className={errors.supplierName ? 'input-error' : ''}
                placeholder="F.eks. XL-BYG"
              />
              {errors.supplierName && <span className="error-text">{errors.supplierName}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="purchasePrice">Indkøbspris (DKK) *</label>
            <input
              type="text"
              id="purchasePrice"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              className={errors.purchasePrice ? 'input-error' : ''}
              placeholder="F.eks. 2850"
            />
            {errors.purchasePrice && <span className="error-text">{errors.purchasePrice}</span>}
            <small className="form-hint">Total indkøbspris for det angivne antal</small>
          </div>

          <div className="form-group">
            <label htmlFor="sellingPrice">Salgspris (DKK) *</label>
            <input
              type="text"
              id="sellingPrice"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleSellingPriceChange}
              className={errors.sellingPrice ? 'input-error' : ''}
              placeholder="F.eks. 4275"
            />
            {errors.sellingPrice && <span className="error-text">{errors.sellingPrice}</span>}
            <small className="form-hint">
              {autoCalculatePrice 
                ? `Auto-beregnet med ${defaultMarkup}% markup` 
                : `Margin: ${calculateMargin()}%`}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod">Betalingsmetode</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Noter</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Ekstra bemærkninger..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {purchase ? 'Gem ændringer' : 'Tilføj materiale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaterialPurchaseModal;