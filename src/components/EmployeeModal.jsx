import React, { useState, useEffect } from 'react';

function EmployeeModal({ employee, onSave, onClose, isOpen }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
    } else {
      setName('');
    }
  }, [employee, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Indtast venligst et navn.');
      return;
    }
    
    onSave({ name: name.trim() });
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