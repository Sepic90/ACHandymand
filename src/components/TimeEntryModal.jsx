import React, { useState, useEffect } from 'react';
import { formatCurrency, parseDecimal } from '../utils/formatUtils';

function TimeEntryModal({ isOpen, onClose, onSave, timeEntry, defaultRate = 450 }) {
  const [formData, setFormData] = useState({
    date: '',
    duration: '',
    activity: '',
    billable: true,
    rate: defaultRate
  });

  const [errors, setErrors] = useState({});
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    if (timeEntry) {
      setFormData({
        date: timeEntry.date || '',
        duration: timeEntry.duration || '',
        activity: timeEntry.activity || '',
        billable: timeEntry.billable !== undefined ? timeEntry.billable : true,
        rate: timeEntry.rate || defaultRate
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        date: today,
        duration: '',
        activity: '',
        billable: true,
        rate: defaultRate
      });
    }
    setErrors({});
  }, [timeEntry, isOpen, defaultRate]);

  useEffect(() => {
    const duration = parseDecimal(formData.duration);
    const rate = parseDecimal(formData.rate);
    setCalculatedTotal(duration * rate);
  }, [formData.duration, formData.rate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.date) {
      newErrors.date = 'Dato er påkrævet';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.date = 'Dato kan ikke være i fremtiden';
      }
    }

    const duration = parseDecimal(formData.duration);
    if (!formData.duration || duration <= 0) {
      newErrors.duration = 'Varighed skal være et positivt tal';
    }

    if (!formData.activity || formData.activity.trim().length < 3) {
      newErrors.activity = 'Aktivitetsbeskrivelse skal være mindst 3 tegn';
    }

    const rate = parseDecimal(formData.rate);
    if (!formData.rate || rate <= 0) {
      newErrors.rate = 'Timepris skal være et positivt tal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Convert duration and rate to numbers
      const dataToSave = {
        ...formData,
        duration: parseDecimal(formData.duration),
        rate: parseDecimal(formData.rate)
      };
      onSave(dataToSave);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{timeEntry ? 'Redigér Timer' : 'Tilføj Timer'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="date">Dato *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="duration">Varighed (timer) *</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={errors.duration ? 'error' : ''}
                placeholder="F.eks. 4,5"
              />
              {errors.duration && <span className="error-message">{errors.duration}</span>}
              <small className="form-hint">Brug komma for decimaler (f.eks. 4,5 timer)</small>
            </div>

            <div className="form-group">
              <label htmlFor="activity">Aktivitetsbeskrivelse *</label>
              <textarea
                id="activity"
                name="activity"
                value={formData.activity}
                onChange={handleChange}
                className={errors.activity ? 'error' : ''}
                rows="3"
                placeholder="Beskriv det udførte arbejde..."
              />
              {errors.activity && <span className="error-message">{errors.activity}</span>}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="billable"
                  checked={formData.billable}
                  onChange={handleChange}
                />
                <span>Fakturerbar</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="rate">Timepris (DKK) *</label>
              <input
                type="text"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                className={errors.rate ? 'error' : ''}
                placeholder="450"
              />
              {errors.rate && <span className="error-message">{errors.rate}</span>}
            </div>

            <div className="calculated-total">
              <strong>Beregnet total:</strong> {formatCurrency(calculatedTotal)}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {timeEntry ? 'Gem Ændringer' : 'Tilføj Timer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TimeEntryModal;