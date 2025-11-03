import React, { useState, useEffect } from 'react';

function TimeEntryModal({ timeEntry, defaultRate, employees, onSave, onClose }) {
  const [formData, setFormData] = useState({
    date: '',
    duration: '',
    activity: '',
    billable: true,
    rate: defaultRate,
    useCustomRate: false,
    employeeName: '',
    selectedEmployees: []
  });

  const [errors, setErrors] = useState({});
  const isOpen = true;

  useEffect(() => {
    if (timeEntry) {
      setFormData({
        date: timeEntry.date || '',
        duration: String(timeEntry.duration || timeEntry.hours || ''),
        activity: timeEntry.activity || timeEntry.description || '',
        billable: timeEntry.billable !== undefined ? timeEntry.billable : true,
        rate: timeEntry.rate || timeEntry.hourlyRate || defaultRate,
        useCustomRate: timeEntry.rate !== defaultRate,
        employeeName: timeEntry.employeeName || '',
        selectedEmployees: timeEntry.employeeName ? [timeEntry.employeeName] : []
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: today,
        duration: '',
        activity: '',
        billable: true,
        rate: defaultRate,
        useCustomRate: false,
        employeeName: employees.length > 0 ? employees[0].name : '',
        selectedEmployees: []
      }));
    }
  }, [timeEntry, defaultRate, employees, isOpen]);

  const parseDecimal = (str) => {
    if (!str) return 0;
    const normalized = String(str).replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'billable') {
        setFormData(prev => ({
          ...prev,
          billable: checked,
          rate: checked ? (prev.useCustomRate ? prev.rate : defaultRate) : 0
        }));
      } else if (name === 'useCustomRate') {
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
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleEmployeeToggle = (employeeName) => {
    setFormData(prev => {
      const isSelected = prev.selectedEmployees.includes(employeeName);
      const newSelected = isSelected
        ? prev.selectedEmployees.filter(name => name !== employeeName)
        : [...prev.selectedEmployees, employeeName];
      
      return {
        ...prev,
        selectedEmployees: newSelected,
        employeeName: newSelected.length > 0 ? newSelected.join(', ') : ''
      };
    });
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

    if (formData.selectedEmployees.length === 0) {
      newErrors.employeeName = 'Vælg mindst én medarbejder';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      const dataToSave = {
        date: formData.date,
        duration: parseDecimal(formData.duration),
        activity: formData.activity,
        billable: formData.billable,
        rate: formData.billable ? parseDecimal(formData.rate) : 0,
        employeeName: formData.employeeName
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
            <label>Medarbejder(e) *</label>
            <div className="employee-multi-select">
              {employees.length === 0 ? (
                <p className="no-employees-text">Ingen medarbejdere tilgængelige. Tilføj medarbejdere i Indstillinger.</p>
              ) : (
                employees.map(employee => (
                  <label key={employee.id} className="checkbox-modern">
                    <input
                      type="checkbox"
                      checked={formData.selectedEmployees.includes(employee.name)}
                      onChange={() => handleEmployeeToggle(employee.name)}
                    />
                    <span className="checkbox-label">{employee.name}</span>
                  </label>
                ))
              )}
            </div>
            {errors.employeeName && <span className="error-text">{errors.employeeName}</span>}
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

          <div className="rate-section">
            <label>Timepris (DKK) *</label>
            
            {!formData.billable ? (
              <div className="rate-display disabled">
                <span className="rate-value">0 kr</span>
                <span className="rate-note">Ikke fakturerbar</span>
              </div>
            ) : (
              <>
                <div className={`rate-display ${formData.useCustomRate ? 'inactive' : 'active'}`}>
                  <span className="rate-value">{defaultRate} kr</span>
                  <span className="rate-note">Standard timepris</span>
                </div>

                <div className="checkbox-group-modern">
                  <label className="checkbox-modern">
                    <input
                      type="checkbox"
                      name="useCustomRate"
                      checked={formData.useCustomRate}
                      onChange={handleChange}
                    />
                    <span className="checkbox-label">Brug tilpasset timepris</span>
                  </label>
                </div>

                {formData.useCustomRate && (
                  <div className="form-group">
                    <input
                      type="text"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      className={errors.rate ? 'input-error' : ''}
                      placeholder="F.eks. 550"
                    />
                    {errors.rate && <span className="error-text">{errors.rate}</span>}
                    <small className="form-hint">Brug komma for decimaler (f.eks. 550,50)</small>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuller
            </button>
            <button type="submit" className="btn-primary">
              {timeEntry ? 'Gem ændringer' : 'Tilføj timer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TimeEntryModal;