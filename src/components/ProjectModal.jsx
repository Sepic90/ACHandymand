import React, { useState, useEffect } from 'react';
import { isValidEmail, isValidPhone } from '../utils/projectUtils';
import { getCityFromPostalCode, formatFullAddress } from '../utils/postalCodeUtils';

function ProjectModal({ isOpen, onClose, onSave, project }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '', // Legacy field for backward compatibility
    streetAddress: '',
    postalCode: '',
    city: '',
    type: 'fixed-price',
    fixedPrice: 0,
    status: 'planned'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      // Check if project has new address format or old format
      if (project.streetAddress || project.postalCode || project.city) {
        // New format
        setFormData({
          name: project.name || '',
          description: project.description || '',
          customerName: project.customerName || '',
          customerPhone: project.customerPhone || '',
          customerEmail: project.customerEmail || '',
          customerAddress: project.customerAddress || '',
          streetAddress: project.streetAddress || '',
          postalCode: project.postalCode || '',
          city: project.city || '',
          type: project.type || 'fixed-price',
          fixedPrice: project.fixedPrice || 0,
          status: project.status || 'planned'
        });
      } else if (project.customerAddress) {
        // Old format - try to parse it
        const addressParts = project.customerAddress.split(',').map(s => s.trim());
        let streetAddress = '';
        let postalCode = '';
        let city = '';
        
        if (addressParts.length >= 2) {
          streetAddress = addressParts[0];
          const secondPart = addressParts[1];
          const match = secondPart.match(/^(\d{4})\s+(.+)$/);
          if (match) {
            postalCode = match[1];
            city = match[2];
          }
        } else if (addressParts.length === 1) {
          streetAddress = addressParts[0];
        }
        
        setFormData({
          name: project.name || '',
          description: project.description || '',
          customerName: project.customerName || '',
          customerPhone: project.customerPhone || '',
          customerEmail: project.customerEmail || '',
          customerAddress: project.customerAddress || '',
          streetAddress,
          postalCode,
          city,
          type: project.type || 'fixed-price',
          fixedPrice: project.fixedPrice || 0,
          status: project.status || 'planned'
        });
      } else {
        // No address at all
        setFormData({
          name: project.name || '',
          description: project.description || '',
          customerName: project.customerName || '',
          customerPhone: project.customerPhone || '',
          customerEmail: project.customerEmail || '',
          customerAddress: '',
          streetAddress: '',
          postalCode: '',
          city: '',
          type: project.type || 'fixed-price',
          fixedPrice: project.fixedPrice || 0,
          status: project.status || 'planned'
        });
      }
    } else {
      setFormData({
        name: '',
        description: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        streetAddress: '',
        postalCode: '',
        city: '',
        type: 'fixed-price',
        fixedPrice: 0,
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

  const handlePostalCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4); // Only digits, max 4
    setFormData(prev => ({
      ...prev,
      postalCode: value
    }));
    
    // Auto-fill city when postal code is 4 digits
    if (value.length === 4) {
      const city = getCityFromPostalCode(value);
      if (city) {
        setFormData(prev => ({
          ...prev,
          city
        }));
        // Clear postal code error if city was found
        if (errors.postalCode) {
          setErrors(prev => ({
            ...prev,
            postalCode: null
          }));
        }
      } else {
        setErrors(prev => ({
          ...prev,
          postalCode: 'Ugyldigt postnummer'
        }));
      }
    } else {
      // Clear error when typing
      if (errors.postalCode) {
        setErrors(prev => ({
          ...prev,
          postalCode: null
        }));
      }
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

    if (formData.postalCode && formData.postalCode.length !== 4) {
      newErrors.postalCode = 'Postnummer skal være 4 cifre';
    }

    if (formData.type === 'fixed-price' && (!formData.fixedPrice || formData.fixedPrice <= 0)) {
      newErrors.fixedPrice = 'Fast pris skal være større end 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Create the formatted address for backward compatibility
      const customerAddress = formatFullAddress(
        formData.streetAddress,
        formData.postalCode,
        formData.city
      );
      
      // Send all data including both new and old format
      onSave({
        ...formData,
        customerAddress, // Legacy format
        streetAddress: formData.streetAddress,
        postalCode: formData.postalCode,
        city: formData.city
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Ret Sag' : 'Ny Sag'}</h2>
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
              <label htmlFor="description">Beskrivelse</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Kort beskrivelse af sagen..."
                rows="3"
              />
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

            <div className="form-section-divider">
              <h3>Adresse</h3>
            </div>

            <div className="form-group">
              <label htmlFor="streetAddress">Vejnavn og nummer</label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="F.eks. Kongevejen 10"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postalCode">Postnummer</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handlePostalCodeChange}
                  className={errors.postalCode ? 'error' : ''}
                  placeholder="2830"
                  maxLength="4"
                />
                {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                <small className="form-hint">Byen udfyldes automatisk</small>
              </div>

              <div className="form-group">
                <label htmlFor="city">By</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Holte"
                  readOnly
                  className="autofilled-field"
                />
                <small className="form-hint">Udfyldes automatisk fra postnummer</small>
              </div>
            </div>

            <div className="form-section-divider">
              <h3>Sagens detaljer</h3>
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

              {formData.type === 'fixed-price' && (
                <div className="form-group">
                  <label htmlFor="fixedPrice">Fast pris (kr) *</label>
                  <input
                    type="number"
                    id="fixedPrice"
                    name="fixedPrice"
                    value={formData.fixedPrice}
                    onChange={handleChange}
                    className={errors.fixedPrice ? 'error' : ''}
                    placeholder="25000"
                    min="0"
                  />
                  {errors.fixedPrice && <span className="error-message">{errors.fixedPrice}</span>}
                </div>
              )}

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