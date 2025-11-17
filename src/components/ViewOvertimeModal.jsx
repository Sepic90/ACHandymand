import React, { useState, useEffect } from 'react';
import { getEmployeeOvertime, deleteOvertime, updateOvertime, parseDate, formatDate } from '../utils/overtimeUtils';
import { useNotification } from '../utils/notificationUtils';

function ViewOvertimeModal({ employee, onClose, onSuccess }) {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOvertime, setSelectedOvertime] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [editDate, setEditDate] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editComment, setEditComment] = useState('');

  const monthNames = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

  useEffect(() => {
    loadOvertime();
  }, []);

  const loadOvertime = async () => {
    setLoading(true);
    const result = await getEmployeeOvertime(employee.id);
    if (result.success) {
      setOvertime(result.overtime);
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

  const getOvertimeForDate = (day) => {
    const dateString = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
    return overtime.filter(ot => ot.date === dateString);
  };

  const handleDateClick = (day) => {
    const dayOvertime = getOvertimeForDate(day);
    if (dayOvertime.length > 0) {
      setSelectedOvertime(dayOvertime[0]);
      setEditMode(false);
    }
  };

  const handleEdit = () => {
    if (!selectedOvertime) return;
    
    const dateObj = parseDate(selectedOvertime.date);
    const isoDate = dateObj.toISOString().split('T')[0];
    
    setEditDate(isoDate);
    setEditHours(selectedOvertime.hours.toString());
    setEditComment(selectedOvertime.comment || '');
    
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editDate || !editHours) {
      showWarning('Udfyld alle påkrævede felter.');
      return;
    }

    if (parseFloat(editHours) <= 0) {
      showWarning('Timer skal være større end 0.');
      return;
    }

    setLoading(true);

    const dateObj = new Date(editDate);
    const formattedDate = formatDate(dateObj);

    const updateData = {
      date: formattedDate,
      hours: parseFloat(editHours),
      comment: editComment
    };

    const result = await updateOvertime(selectedOvertime.id, updateData);

    if (result.success) {
      showSuccess('Overarbejde opdateret!');
      await loadOvertime();
      setSelectedOvertime(null);
      setEditMode(false);
      onSuccess();
    } else {
      showError('Fejl ved opdatering af overarbejde.');
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedOvertime) return;

    const confirmed = await showConfirm({
      title: 'Slet overarbejde',
      message: 'Er du sikker på at du vil slette denne overarbejdsregistrering?',
      confirmText: 'Slet',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    setLoading(true);

    const result = await deleteOvertime(selectedOvertime.id);

    if (result.success) {
      showSuccess('Overarbejde slettet!');
      await loadOvertime();
      setSelectedOvertime(null);
      setEditMode(false);
      onSuccess();
    } else {
      showError('Fejl ved sletning af overarbejde.');
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
      const dayOvertime = getOvertimeForDate(day);
      const hasOvertime = dayOvertime.length > 0;

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${hasOvertime ? 'has-absence' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="calendar-day-number">{day}</div>
          {hasOvertime && (
            <div className="calendar-absence-indicator" style={{ background: '#3498db' }}>
              OA: {dayOvertime[0].hours}t
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Se / rediger overarbejde - {employee.name}</h2>
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

              {selectedOvertime && !editMode && (
                <div className="absence-details">
                  <h4>Overarbejde detaljer</h4>
                  <div className="detail-row">
                    <strong>Dato:</strong> {selectedOvertime.date}
                  </div>
                  <div className="detail-row">
                    <strong>Timer:</strong> {selectedOvertime.hours} timer
                  </div>
                  {selectedOvertime.comment && (
                    <div className="detail-row">
                      <strong>Kommentar:</strong> {selectedOvertime.comment}
                    </div>
                  )}
                  <div className="detail-actions">
                    <button className="btn-primary btn-small" onClick={handleEdit}>
                      Rediger
                    </button>
                    <button className="btn-danger btn-small" onClick={handleDelete}>
                      Slet
                    </button>
                  </div>
                </div>
              )}

              {selectedOvertime && editMode && (
                <div className="absence-edit-form">
                  <h4>Rediger overarbejde</h4>
                  
                  <div className="form-group">
                    <label>Dato *</label>
                    <input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Antal timer *</label>
                    <input 
                      type="number" 
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      step="0.5"
                      min="0.5"
                      max="24"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Kommentar (valgfri)</label>
                    <input 
                      type="text" 
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                    />
                  </div>

                  <div className="detail-actions">
                    <button className="btn-secondary btn-small" onClick={() => setEditMode(false)}>
                      Annuller
                    </button>
                    <button className="btn-primary btn-small" onClick={handleSaveEdit}>
                      Gem ændringer
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewOvertimeModal;