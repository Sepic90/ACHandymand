import React, { useState, useEffect } from 'react';
import { isValidEmail, isValidPhone } from '../utils/projectUtils';

function ProjectModal({ isOpen, onClose, onSave, project }) {
  const [formData, setFormData] = useState({
    name: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    type: 'fixed-price',
    status: 'planned'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        customerName: project.customerName || '',
        customerPhone: project.customerPhone || '',
        customerEmail: project.customerEmail || '',
        address: project.address || '',
        type: project.type || 'fixed-price',
        status: project.status || 'planned'
      });
    } else {
      setFormData({
        name: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        address: '',
        type: 'fixed-price',
        status: 'planned'
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Sagsnavn skal være mindst 3 tegn';
    }

    if (formData.customerEmail && !isValidEmail(formData.customerEmail)) {
      newErrors.customerEmail = 'Ugyldig email adresse';
    }

    if (formData.customerPhone && !isValidPhone(formData.customerPhone)) {
      newErrors.customerPhone = 'Telefonnummer skal være 8 cifre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Redigér Sag' : 'Ny Sag'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Sagsnavn *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="F.eks. Køkkenrenovering"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customerName">Kundenavn</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="F.eks. Peter Jensen"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerPhone">Telefon</label>
                <input
                  type="text"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className={errors.customerPhone ? 'error' : ''}
                  placeholder="12345678"
                />
                {errors.customerPhone && <span className="error-message">{errors.customerPhone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail">Email</label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className={errors.customerEmail ? 'error' : ''}
                  placeholder="kunde@example.com"
                />
                {errors.customerEmail && <span className="error-message">{errors.customerEmail}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="F.eks. Hovedgaden 123, 1234 København"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="fixed-price">Fast Pris</option>
                  <option value="time-material">Tid & Materiale</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="planned">Planlagt</option>
                  <option value="in-progress">I Gang</option>
                  <option value="ready-for-invoice">Klar til Faktura</option>
                  <option value="closed">Lukket</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {project ? 'Gem Ændringer' : 'Opret Sag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectModal;