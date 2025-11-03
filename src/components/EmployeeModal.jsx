import React, { useState, useEffect } from 'react';

function EmployeeModal({ employee, onSave, onClose, isOpen, defaultRate = 450 }) {
  const [name, setName] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRate, setCustomRate] = useState(450);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setUseCustomRate(employee.useCustomRate || false);
      setCustomRate(employee.customRate || defaultRate);
    } else {
      setName('');
      setUseCustomRate(false);
      setCustomRate(defaultRate);
    }
  }, [employee, isOpen, defaultRate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Indtast venligst et navn.');
      return;
    }
    
    const employeeData = {
      name: name.trim(),
      useCustomRate,
      customRate: useCustomRate ? parseFloat(customRate) || defaultRate : null
    };
    
    onSave(employeeData);
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Indtast medarbejdernavn"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Timepris</label>
              
              <div className="radio-option">
                <label>
                  <input
                    type="radio"
                    name="rateType"
                    checked={!useCustomRate}
                    onChange={() => setUseCustomRate(false)}
                  />
                  <span>Brug standard timepris ({defaultRate} kr/time)</span>
                </label>
              </div>

              <div className="radio-option">
                <label>
                  <input
                    type="radio"
                    name="rateType"
                    checked={useCustomRate}
                    onChange={() => setUseCustomRate(true)}
                  />
                  <span>Tilpasset timepris</span>
                </label>
              </div>

              {useCustomRate && (
                <div className="custom-rate-container">
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    min="0"
                    step="50"
                    placeholder="450"
                  />
                  <span>kr/time</span>
                </div>
              )}
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