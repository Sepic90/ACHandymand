import React, { useState, useEffect } from 'react';
import { getEmployeeAbsences, deleteAbsence, updateAbsence, parseDate, formatDate } from '../utils/absenceUtils';
import { useNotification } from '../utils/notificationUtils';

function ViewAbsenceModal({ employee, onClose, onSuccess }) {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [editDate, setEditDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editComment, setEditComment] = useState('');
  const [editHoursWorked, setEditHoursWorked] = useState('');

  const absenceReasons = ['Feriedag', 'Feriefridag', 'Syg', 'Helligdag', 'Andet'];
  const monthNames = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

  useEffect(() => {
    loadAbsences();
  }, []);

  const loadAbsences = async () => {
    setLoading(true);
    const result = await getEmployeeAbsences(employee.id);
    if (result.success) {
      setAbsences(result.absences);
    }
    setLoading(false);
  };

  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getAbsencesForDate = (day) => {
    const dateString = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
    
    return absences.filter(absence => {
      if (absence.type === 'extended' && absence.endDate) {
        const start = parseDate(absence.date);
        const end = parseDate(absence.endDate);
        const check = parseDate(dateString);
        return check >= start && check <= end;
      }
      return absence.date === dateString;
    });
  };

  const handleDateClick = (day) => {
    const dayAbsences = getAbsencesForDate(day);
    if (dayAbsences.length > 0) {
      setSelectedAbsence(dayAbsences[0]);
      setEditMode(false);
    }
  };

  const handleEdit = () => {
    if (!selectedAbsence) return;
    
    const dateObj = parseDate(selectedAbsence.date);
    const isoDate = dateObj.toISOString().split('T')[0];
    
    setEditDate(isoDate);
    setEditReason(selectedAbsence.absenceReason);
    setEditComment(selectedAbsence.comment || '');
    setEditHoursWorked(selectedAbsence.hoursWorked || '');
    
    if (selectedAbsence.endDate) {
      const endDateObj = parseDate(selectedAbsence.endDate);
      const isoEndDate = endDateObj.toISOString().split('T')[0];
      setEditEndDate(isoEndDate);
    } else {
      setEditEndDate('');
    }
    
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editDate || !editReason) {
      showWarning('Udfyld alle påkrævede felter.');
      return;
    }

    setLoading(true);

    const dateObj = new Date(editDate);
    const formattedDate = formatDate(dateObj);

    const updateData = {
      date: formattedDate,
      absenceReason: editReason,
      comment: editComment
    };

    if (selectedAbsence.type === 'partial') {
      updateData.hoursWorked = parseFloat(editHoursWorked);
    }

    if (selectedAbsence.type === 'extended' && editEndDate) {
      const endDateObj = new Date(editEndDate);
      updateData.endDate = formatDate(endDateObj);
    }

    const result = await updateAbsence(selectedAbsence.id, updateData);

    if (result.success) {
      showSuccess('Fravær opdateret!');
      await loadAbsences();
      setSelectedAbsence(null);
      setEditMode(false);
      onSuccess();
    } else {
      showError('Fejl ved opdatering af fravær.');
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedAbsence) return;

    const confirmed = await showConfirm({
      title: 'Slet fravær',
      message: 'Er du sikker på at du vil slette dette fravær?',
      confirmText: 'Slet',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    setLoading(true);

    const result = await deleteAbsence(selectedAbsence.id);

    if (result.success) {
      showSuccess('Fravær slettet!');
      await loadAbsences();
      setSelectedAbsence(null);
      setEditMode(false);
      onSuccess();
    } else {
      showError('Fejl ved sletning af fravær.');
    }

    setLoading(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayAbsences = getAbsencesForDate(day);
      const hasAbsence = dayAbsences.length > 0;

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${hasAbsence ? 'has-absence' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="calendar-day-number">{day}</div>
          {hasAbsence && (
            <div className="calendar-absence-indicator">
              {dayAbsences[0].absenceReason.substring(0, 3)}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Se / rediger fravær - {employee.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="calendar-navigation">
            <button 
              className="btn-secondary btn-small" 
              onClick={() => navigateMonth(-1)}
              disabled={loading}
            >
              ‹ Forrige
            </button>
            <h3>{monthNames[currentMonth]} {currentYear}</h3>
            <button 
              className="btn-secondary btn-small" 
              onClick={() => navigateMonth(1)}
              disabled={loading}
            >
              Næste ›
            </button>
          </div>

          {loading && <p>Indlæser...</p>}

          {!loading && (
            <>
              <div className="calendar-container">
                <div className="calendar-header">
                  <div className="calendar-header-day">Man</div>
                  <div className="calendar-header-day">Tir</div>
                  <div className="calendar-header-day">Ons</div>
                  <div className="calendar-header-day">Tor</div>
                  <div className="calendar-header-day">Fre</div>
                  <div className="calendar-header-day">Lør</div>
                  <div className="calendar-header-day">Søn</div>
                </div>
                <div className="calendar-grid">
                  {renderCalendar()}
                </div>
              </div>

              {selectedAbsence && !editMode && (
                <div className="absence-details">
                  <h4>Fraværsdetaljer</h4>
                  <div className="detail-row">
                    <strong>Dato:</strong> {selectedAbsence.date}
                    {selectedAbsence.endDate && ` til ${selectedAbsence.endDate}`}
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong> {selectedAbsence.absenceReason}
                  </div>
                  {selectedAbsence.hoursWorked !== undefined && (
                    <div className="detail-row">
                      <strong>Arbejdstimer:</strong> {selectedAbsence.hoursWorked}
                    </div>
                  )}
                  {selectedAbsence.comment && (
                    <div className="detail-row">
                      <strong>Kommentar:</strong> {selectedAbsence.comment}
                    </div>
                  )}
                  <div className="detail-actions">
                    <button className="btn-primary btn-small" onClick={handleEdit}>
                      Rediger
                    </button>
                    <button className="btn-small btn-danger" onClick={handleDelete}>
                      Slet
                    </button>
                    <button className="btn-secondary btn-small" onClick={() => setSelectedAbsence(null)}>
                      Luk
                    </button>
                  </div>
                </div>
              )}

              {selectedAbsence && editMode && (
                <div className="absence-details">
                  <h4>Rediger fravær</h4>
                  
                  <div className="form-group">
                    <label>Dato *</label>
                    <input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>

                  {selectedAbsence.type === 'extended' && (
                    <div className="form-group">
                      <label>Slut dato *</label>
                      <input 
                        type="date" 
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Type af fravær *</label>
                    <select 
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                    >
                      {absenceReasons.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {selectedAbsence.type === 'partial' && (
                    <div className="form-group">
                      <label>Arbejdstimer *</label>
                      <input 
                        type="number" 
                        step="0.5"
                        min="0"
                        max="12"
                        value={editHoursWorked}
                        onChange={(e) => setEditHoursWorked(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Kommentar</label>
                    <input 
                      type="text" 
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                    />
                  </div>

                  <div className="detail-actions">
                    <button className="btn-primary btn-small" onClick={handleSaveEdit}>
                      Gem ændringer
                    </button>
                    <button className="btn-secondary btn-small" onClick={() => setEditMode(false)}>
                      Annuller
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Luk</button>
        </div>
      </div>
    </div>
  );
}

export default ViewAbsenceModal;