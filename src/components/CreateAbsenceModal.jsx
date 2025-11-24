import React, { useState } from 'react';
import { createAbsence, formatDate } from '../utils/absenceUtils';
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

  const absenceReasons = ['Feriedag', 'Feriefridag', 'Barn sygedag', 'Sygedag', 'Søgnehelligdag', 'Andet'];

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
      
      if (applyToAll && activeTab === 'single') {
        // Apply to all employees
        const promises = employees.map(emp => {
          const absenceData = {
            employeeId: emp.id,
            employeeName: emp.name,
            date: formattedDate,
            type: activeTab,
            absenceReason,
            comment: comment || ''
          };
          
          // Pass employee data for SH accumulation
          return createAbsence(absenceData, emp);
        });

        await Promise.all(promises);
        showSuccess('Fravær oprettet for alle medarbejdere!');
        onSuccess();
        onClose();
      } else {
        // Single employee
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

        // Pass employee data for SH accumulation
        const result = await createAbsence(absenceData, employee);

        if (result.success) {
          let message = 'Fravær oprettet!';
          
          // Add SH notification if applicable
          if (absenceReason === 'Søgnehelligdag' && employee.internalHourlyRate) {
            message += ' SH-akkumulering registreret automatisk.';
          } else if (absenceReason === 'Søgnehelligdag' && !employee.internalHourlyRate) {
            message += ' Bemærk: Medarbejderen har ingen intern timepris - SH ikke beregnet.';
          }
          
          showSuccess(message);
          onSuccess();
          onClose();
        } else {
          showError('Fejl ved oprettelse af fravær.');
        }
      }
    } catch (error) {
      console.error('Error creating absence:', error);
      showError('Der opstod en fejl.');
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Opret fravær for {employee.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'partial' ? 'active' : ''}`}
              onClick={() => setActiveTab('partial')}
            >
              Delvis fravær
            </button>
            <button 
              className={`tab ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              Hel dag
            </button>
            <button 
              className={`tab ${activeTab === 'extended' ? 'active' : ''}`}
              onClick={() => setActiveTab('extended')}
            >
              Periode
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
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
                  <label>Arbejdstimer *</label>
                  <input 
                    type="number" 
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    placeholder="Antal timer arbejdet"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                  />
                  <small className="form-hint">
                    Indtast hvor mange timer medarbejderen arbejdede denne dag
                  </small>
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
                    placeholder="f.eks. Lægebesøg"
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
                  {absenceReason === 'Søgnehelligdag' && !employee.internalHourlyRate && (
                    <small className="form-hint" style={{ color: '#e74c3c' }}>
                      ⚠️ Medarbejderen har ingen intern timepris - SH vil ikke blive beregnet automatisk
                    </small>
                  )}
                  {absenceReason === 'Søgnehelligdag' && employee.internalHourlyRate && (
                    <small className="form-hint" style={{ color: '#27ae60' }}>
                      ✓ SH-akkumulering vil blive beregnet automatisk (14,7% af dagløn)
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Kommentar (valgfri)</label>
                  <input 
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="f.eks. Lægebesøg"
                  />
                </div>

                <div className="checkbox-group" style={{ marginTop: '15px' }}>
                  <input
                    type="checkbox"
                    id="applyToAll"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                  />
                  <label htmlFor="applyToAll">Lukkedag - Anvend til alle medarbejdere</label>
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
                    placeholder="f.eks. Ferie i Spanien"
                  />
                </div>
              </>
            )}

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
                {loading ? 'Opretter...' : 'Opret fravær'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAbsenceModal;