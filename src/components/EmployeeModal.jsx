import React, { useState, useEffect } from 'react';

function EmployeeModal({ employee, onSave, onClose, isOpen }) {
  const [name, setName] = useState('');
  const [internalHourlyRate, setInternalHourlyRate] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setInternalHourlyRate(employee.internalHourlyRate || '');
    } else {
      setName('');
      setInternalHourlyRate('');
    }
    setErrors({});
  }, [employee, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Navn er påkrævet';
    }
    
    if (internalHourlyRate && internalHourlyRate !== '') {
      const rate = parseFloat(internalHourlyRate);
      if (isNaN(rate) || rate < 0) {
        newErrors.internalHourlyRate = 'Indtast en gyldig timepris';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const data = {
      name: name.trim()
    };
    
    // Only include hourly rate if a value was entered
    if (internalHourlyRate && internalHourlyRate !== '') {
      data.internalHourlyRate = parseFloat(internalHourlyRate);
    }
    
    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{employee ? 'Redigér medarbejder' : 'Tilføj medarbejder'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="employeeName">Navn *</label>
              <input
                type="text"
                id="employeeName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                className={errors.name ? 'input-error' : ''}
                placeholder="Indtast medarbejdernavn"
                autoFocus
                required
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="internalHourlyRate">Intern timepris (kr.)</label>
              <input
                type="number"
                id="internalHourlyRate"
                value={internalHourlyRate}
                onChange={(e) => {
                  setInternalHourlyRate(e.target.value);
                  if (errors.internalHourlyRate) setErrors(prev => ({ ...prev, internalHourlyRate: null }));
                }}
                className={errors.internalHourlyRate ? 'input-error' : ''}
                placeholder="F.eks. 250"
                step="0.01"
                min="0"
              />
              {errors.internalHourlyRate && <span className="error-text">{errors.internalHourlyRate}</span>}
              <small className="form-hint">
                Den løn firmaet betaler medarbejderen per time. Bruges til SH-beregninger.
              </small>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {employee ? 'Gem' : 'Tilføj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeModal;