import React, { useState, useEffect } from 'react';

function SupplierModal({ supplier, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    cvr: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    customerNumber: '',
    type: '',
    preferredPaymentMethod: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const supplierTypes = [
    'Byggemarked',
    'Grossist',
    'Specialforhandler',
    'Tømmerhandel',
    'El-grossist',
    'VVS-grossist',
    'Malerforretning',
    'Værktøjsforhandler',
    'Andet'
  ];

  const paymentMethods = [
    'Faktura',
    'Kontant',
    'Kort',
    'Firmakort',
    'MobilePay',
    'Konto'
  ];

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        cvr: supplier.cvr || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        customerNumber: supplier.customerNumber || '',
        type: supplier.type || '',
        preferredPaymentMethod: supplier.preferredPaymentMethod || '',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const formatCVR = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 8 digits
    return digits.slice(0, 8);
  };

  const handleCVRChange = (e) => {
    const formatted = formatCVR(e.target.value);
    setFormData(prev => ({ ...prev, cvr: formatted }));
    if (errors.cvr) {
      setErrors(prev => ({ ...prev, cvr: null }));
    }
  };

  const formatPhone = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 8 digits (Danish phone numbers)
    return digits.slice(0, 8);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Leverandørnavn er påkrævet (min. 2 tegn)';
    }

    if (!formData.cvr || formData.cvr.length !== 8) {
      newErrors.cvr = 'CVR skal være 8 cifre';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ugyldig email-adresse';
    }

    if (formData.phone && formData.phone.length !== 8) {
      newErrors.phone = 'Telefonnummer skal være 8 cifre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      const dataToSave = {
        name: formData.name.trim(),
        cvr: formData.cvr,
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        customerNumber: formData.customerNumber.trim(),
        type: formData.type,
        preferredPaymentMethod: formData.preferredPaymentMethod,
        notes: formData.notes.trim()
      };

      onSave(dataToSave);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{supplier ? 'Redigér Leverandør' : 'Tilføj Leverandør'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="form-section-title">Grundoplysninger</h3>
            
            <div className="form-group">
              <label htmlFor="name">Leverandørnavn *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
                placeholder="F.eks. XL-BYG Slagelse"
                autoFocus
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="cvr">CVR-nummer *</label>
              <input
                type="text"
                id="cvr"
                name="cvr"
                value={formData.cvr}
                onChange={handleCVRChange}
                className={errors.cvr ? 'input-error' : ''}
                placeholder="12345678"
                maxLength="8"
              />
              {errors.cvr && <span className="error-text">{errors.cvr}</span>}
              <small className="form-hint">8 cifre uden mellemrum</small>
            </div>

            <div className="form-group">
              <label htmlFor="customerNumber">Kundenummer</label>
              <input
                type="text"
                id="customerNumber"
                name="customerNumber"
                value={formData.customerNumber}
                onChange={handleChange}
                placeholder="Vores kundenummer hos leverandøren"
              />
              <small className="form-hint">Jeres kontonummer eller kundenummer hos denne leverandør</small>
            </div>

            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="">-- Vælg type --</option>
                {supplierTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h3 className="form-section-title">Kontaktoplysninger</h3>

            <div className="form-group">
              <label htmlFor="contactPerson">Kontaktperson</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="F.eks. Hans Jensen"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefon</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                className={errors.phone ? 'input-error' : ''}
                placeholder="12345678"
                maxLength="8"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
              <small className="form-hint">8 cifre uden mellemrum</small>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
                placeholder="kontakt@leverandoer.dk"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                placeholder="Gadenavn 123&#10;1234 By"
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="form-section">
            <h3 className="form-section-title">Betaling</h3>

            <div className="form-group">
              <label htmlFor="preferredPaymentMethod">Foretrukken betalingsmetode</label>
              <select
                id="preferredPaymentMethod"
                name="preferredPaymentMethod"
                value={formData.preferredPaymentMethod}
                onChange={handleChange}
              >
                <option value="">-- Vælg betalingsmetode --</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-section">
            <h3 className="form-section-title">Noter</h3>

            <div className="form-group">
              <label htmlFor="notes">Interne bemærkninger</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Ekstra noter om leverandøren..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {supplier ? 'Gem ændringer' : 'Tilføj leverandør'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierModal;