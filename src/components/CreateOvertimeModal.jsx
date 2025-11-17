import React, { useState } from 'react';
import { createOvertime, formatDate } from '../utils/overtimeUtils';
import { useNotification } from '../utils/notificationUtils';

function CreateOvertimeModal({ employee, onClose, onSuccess }) {
  const { showSuccess, showError, showWarning } = useNotification();
  const [loading, setLoading] = useState(false);
  
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      showWarning('Vælg venligst en dato.');
      return;
    }

    if (!hours || parseFloat(hours) <= 0) {
      showWarning('Indtast antal overarbejdstimer (skal være større end 0).');
      return;
    }

    setLoading(true);

    try {
      const dateObj = new Date(date);
      const formattedDate = formatDate(dateObj);
      
      const overtimeData = {
        employeeId: employee.id,
        employeeName: employee.name,
        date: formattedDate,
        hours: parseFloat(hours),
        comment: comment || ''
      };

      const result = await createOvertime(overtimeData);

      if (result.success) {
        showSuccess('Overarbejde registreret!');
        onSuccess();
        onClose();
      } else {
        showError('Fejl ved registrering af overarbejde.');
      }
    } catch (error) {
      console.error('Error creating overtime:', error);
      showError('Der opstod en fejl.');
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrer overarbejde for {employee.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Dato *</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Antal timer *</label>
              <input 
                type="number" 
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                step="0.5"
                min="0.5"
                max="24"
                placeholder="f.eks. 2 eller 3.5"
                required
              />
              <span className="form-hint">Indtast antal overarbejdstimer</span>
            </div>

            <div className="form-group">
              <label>Kommentar (valgfri)</label>
              <input 
                type="text" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="f.eks. Akut opgave hos kunde"
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Annuller
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Registrerer...' : 'Registrer overarbejde'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateOvertimeModal;