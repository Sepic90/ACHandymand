import React, { useState, useEffect } from 'react';
import { formatCurrency, parseDecimal } from '../utils/formatUtils';

function TimeEntryModal({ isOpen, onClose, onSave, timeEntry, defaultRate = 450 }) {
  const [formData, setFormData] = useState({
    date: '',
    duration: '',
    activity: '',
    billable: true,
    useCustomRate: false,
    rate: defaultRate
  });

  const [errors, setErrors] = useState({});
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    if (timeEntry) {
      // When editing existing entry
      const entryRate = timeEntry.rate || defaultRate;
      const isCustom = entryRate !== defaultRate;
      
      setFormData({
        date: timeEntry.date || '',
        duration: timeEntry.duration?.toString() || '',
        activity: timeEntry.activity || '',
        billable: timeEntry.billable !== undefined ? timeEntry.billable : true,
        useCustomRate: isCustom,
        rate: entryRate
      });
    } else {
      // New entry
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        date: today,
        duration: '',
        activity: '',
        billable: true,
        useCustomRate: false,
        rate: defaultRate
      });
    }
    setErrors({});
  }, [timeEntry, isOpen, defaultRate]);

  useEffect(() => {
    // Auto-calculate total
    const duration = parseDecimal(formData.duration);
    const rate = formData.billable ? parseDecimal(formData.rate) : 0;
    setCalculatedTotal(duration * rate);
  }, [formData.duration, formData.rate, formData.billable]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'billable') {
        // When toggling billable, reset rate to default
        setFormData(prev => ({
          ...prev,
          billable: checked,
          useCustomRate: false,
          rate: checked ? defaultRate : 0
        }));
      } else if (name === 'useCustomRate') {
        // When toggling custom rate
        setFormData(prev => ({
          ...prev,
          useCustomRate: checked,
          rate: checked ? (prev.rate || defaultRate) : defaultRate
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

    if (formData.billable) {
      const rate = parseDecimal(formData.rate);
      if (!formData.rate || rate <= 0) {
        newErrors.rate = 'Timepris skal være et positivt tal';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Prepare data to save
      const dataToSave = {
        date: formData.date,
        duration: parseDecimal(formData.duration),
        activity: formData.activity,
        billable: formData.billable,
        rate: formData.billable ? parseDecimal(formData.rate) : 0
      };
      onSave(dataToSave);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content time-entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{timeEntry ? 'Redigér Timer' : 'Tilføj Timer'}</h2>
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

          <div className="form-group">
            <label htmlFor="duration">Varighed (timer) *</label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={errors.duration ? 'input-error' : ''}
              placeholder="F.eks. 4,5"
            />
            {errors.duration && <span className="error-text">{errors.duration}</span>}
            <small className="form-hint">Brug komma for decimaler (f.eks. 4,5 timer)</small>
          </div>

          <div className="form-group">
            <label htmlFor="activity">Aktivitetsbeskrivelse *</label>
            <textarea
              id="activity"
              name="activity"
              value={formData.activity}
              onChange={handleChange}
              className={errors.activity ? 'input-error' : ''}
              rows="3"
              placeholder="Beskriv det udførte arbejde..."
            />
            {errors.activity && <span className="error-text">{errors.activity}</span>}
          </div>

          <div className="checkbox-group-modern">
            <label className="checkbox-modern">
              <input
                type="checkbox"
                name="billable"
                checked={formData.billable}
                onChange={handleChange}
              />
              <span className="checkbox-label">Fakturerbar</span>
            </label>
          </div>

          {/* Timepris Section */}
          <div className="rate-section">
            <label>Timepris (DKK) *</label>
            
            {!formData.billable ? (
              // Not billable - show 0 kr
              <div className="rate-display disabled">
                <span className="rate-value">0 kr</span>
                <span className="rate-note">Ikke fakturerbar</span>
              </div>
            ) : (
              <>
                {/* Standard Rate Display */}
                <div className={`rate-display ${formData.useCustomRate ? 'disabled' : ''}`}>
                  <span className="rate-value">{defaultRate} kr</span>
                  <span className="rate-note">Standard timepris</span>
                </div>

                {/* Custom Rate Checkbox */}
                <div className="checkbox-group-modern" style={{ marginTop: '12px' }}>
                  <label className="checkbox-modern">
                    <input
                      type="checkbox"
                      name="useCustomRate"
                      checked={formData.useCustomRate}
                      onChange={handleChange}
                    />
                    <span className="checkbox-label">Anden timepris</span>
                  </label>
                </div>

                {/* Custom Rate Input */}
                {formData.useCustomRate && (
                  <div className="custom-rate-input" style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      className={errors.rate ? 'input-error' : ''}
                      placeholder="450"
                    />
                    <span className="rate-suffix">kr/time</span>
                  </div>
                )}
                
                {errors.rate && <span className="error-text">{errors.rate}</span>}
              </>
            )}
          </div>

          {/* Calculated Total */}
          <div className="calculated-total-box">
            <div className="total-label">Beregnet total:</div>
            <div className="total-value">{formatCurrency(calculatedTotal)}</div>
          </div>

          <div className="modal-actions">
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