import React, { useState } from 'react';
import { createAbsence, createAbsenceForAllEmployees, formatDate } from '../utils/absenceUtils';
import { useNotification } from '../utils/notificationUtils';

function CreateAbsenceModal({ employee, employees, onClose, onSuccess }) {
  const { showSuccess, showError, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState('partial');
  const [loading, setLoading] = useState(false);
  
  const [date, setDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('Feriedag');
  const [comment, setComment] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);

  const absenceReasons = ['Feriedag', 'Feriefridag', 'Syg', 'Helligdag', 'Andet'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      showWarning('Vælg venligst en dato.');
      return;
    }

    if (activeTab === 'partial' && !hoursWorked) {
      showWarning('Indtast antal arbejdstimer.');
      return;
    }

    if (activeTab === 'extended' && !endDate) {
      showWarning('Vælg venligst slut dato.');
      return;
    }

    if (activeTab === 'extended') {
      const start = new Date(date);
      const end = new Date(endDate);
      if (end < start) {
        showError('Slut dato skal være efter start dato.');
        return;
      }
    }

    setLoading(true);

    try {
      const dateObj = new Date(date);
      const formattedDate = formatDate(dateObj);
      
      const absenceData = {
        employeeId: employee.id,
        employeeName: employee.name,
        date: formattedDate,
        type: activeTab,
        absenceReason,
        comment: comment || ''
      };

      if (activeTab === 'partial') {
        absenceData.hoursWorked = parseFloat(hoursWorked);
      }

      if (activeTab === 'extended') {
        const endDateObj = new Date(endDate);
        absenceData.endDate = formatDate(endDateObj);
      }

      if (applyToAll && activeTab === 'single') {
        const result = await createAbsenceForAllEmployees(employees, {
          date: formattedDate,
          type: activeTab,
          absenceReason,
          comment: comment || ''
        });

        if (result.success) {
          showSuccess('Fravær oprettet for alle medarbejdere!');
          onSuccess();
          onClose();
        } else {
          showError('Fejl ved oprettelse af fravær for alle medarbejdere.');
        }
      } else {
        const result = await createAbsence(absenceData);

        if (result.success) {
          showSuccess('Fravær oprettet!');
          onSuccess();
          onClose();
        } else {
          showError('Fejl ved oprettelse af fravær.');
        }
      }
    } catch (error) {
      console.error('Error creating absence:', error);
      showError('Der opstod en fejl.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Opret fravær - {employee.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="absence-tabs">
          <button 
            className={`absence-tab ${activeTab === 'partial' ? 'active' : ''}`}
            onClick={() => setActiveTab('partial')}
          >
            Delvist fravær
          </button>
          <button 
            className={`absence-tab ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            Enkelte fraværsdage
          </button>
          <button 
            className={`absence-tab ${activeTab === 'extended' ? 'active' : ''}`}
            onClick={() => setActiveTab('extended')}
          >
            Længere fravær
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {activeTab === 'partial' && (
              <>
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
                  <label>Antal arbejdstimer *</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    max="12"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    placeholder="f.eks. 4"
                    required
                  />
                  <span className="form-hint">Indtast hvor mange timer der blev arbejdet</span>
                </div>

                <div className="form-group">
                  <label>Kommentar (valgfri)</label>
                  <input 
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="f.eks. Gik hjem kl. 12"
                  />
                </div>
              </>
            )}

            {activeTab === 'single' && (
              <>
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
                  <label>Type af fravær *</label>
                  <select 
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    required
                  >
                    {absenceReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kommentar (valgfri)</label>
                  <input 
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="f.eks. Betalt ferie"
                  />
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="applyToAll"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                  />
                  <label htmlFor="applyToAll" className="checkbox-label">
                    Lukkedag - tilføj fravær på alle medarbejdere
                  </label>
                </div>
              </>
            )}

            {activeTab === 'extended' && (
              <>
                <div className="form-group">
                  <label>Start dato *</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Slut dato *</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type af fravær *</label>
                  <select 
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    required
                  >
                    {absenceReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kommentar (valgfri)</label>
                  <input 
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="f.eks. Sommerferie"
                  />
                </div>
              </>
            )}

          </div>

          <div className="modal-footer">
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
              {loading ? 'Gemmer...' : 'Gem fravær'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAbsenceModal;