import React, { useState, useEffect } from 'react';
import { formatDateDDMMYYYY, formatTime } from '../utils/calendarUtils';
import { useNotification } from '../utils/notificationUtils';

function CalendarEventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editEvent = null,
  selectedDate = null,
  employees = [],
  projects = []
}) {
  const { showWarning } = useNotification();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [employeeIds, setEmployeeIds] = useState([]);
  const [sagsnummer, setSagsnummer] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('work');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      
      if (editEvent.date) {
        const [day, month, year] = editEvent.date.split('/');
        setDate(`${year}-${month}-${day}`);
      }
      
      setStartTime(editEvent.startTime || '');
      setEndTime(editEvent.endTime || '');
      setEmployeeIds(editEvent.employeeIds || []);
      setSagsnummer(editEvent.sagsnummer || '');
      setDescription(editEvent.description || '');
      setEventType(editEvent.eventType || 'work');
    } else if (selectedDate) {
      const [day, month, year] = selectedDate.split('/');
      setDate(`${year}-${month}-${day}`);
      setTitle('');
      setStartTime('');
      setEndTime('');
      setEmployeeIds([]);
      setSagsnummer('');
      setDescription('');
      setEventType('work');
    } else {
      setTitle('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setEmployeeIds([]);
      setSagsnummer('');
      setDescription('');
      setEventType('work');
    }
  }, [editEvent, selectedDate, isOpen]);

  const handleEmployeeToggle = (employeeId) => {
    if (employeeIds.includes(employeeId)) {
      setEmployeeIds(employeeIds.filter(id => id !== employeeId));
    } else {
      setEmployeeIds([...employeeIds, employeeId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showWarning('Indtast venligst en titel.');
      return;
    }
    
    if (!date) {
      showWarning('Vælg venligst en dato.');
      return;
    }
    
    if (employeeIds.length === 0) {
      showWarning('Vælg mindst én medarbejder.');
      return;
    }

    setLoading(true);

    try {
      const dateObj = new Date(date);
      const formattedDate = formatDateDDMMYYYY(dateObj);
      
      const eventData = {
        title: title.trim(),
        date: formattedDate,
        startTime: startTime || null,
        endTime: endTime || null,
        employeeIds,
        employeeNames: employeeIds.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? emp.name : '';
        }),
        sagsnummer: sagsnummer || null,
        description: description.trim() || null,
        eventType
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format project display: #Sagsnummer - Kunde - Adresse
  const getProjectDisplay = (project) => {
    const parts = [];
    
    if (project.sagsnummer) {
      parts.push(`#${project.sagsnummer}`);
    }
    
    if (project.customerName) {
      parts.push(project.customerName);
    }
    
    // Get address without zip/city
    if (project.address) {
      parts.push(project.address);
    }
    
    return parts.join(' - ') || `Sag #${project.sagsnummer}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calendar-event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editEvent ? 'Redigér begivenhed' : 'Opret ny begivenhed'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-group">
              <label>Titel *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="F.eks. Badeværelse renovering"
                required
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="work">Arbejde</option>
                <option value="meeting">Møde</option>
                <option value="call">Telefonmøde</option>
                <option value="other">Andet</option>
              </select>
            </div>

            <div className="form-row">
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
                <label>Start tid (valgfri)</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Slut tid (valgfri)</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Medarbejdere *</label>
              <div className="employee-checkbox-list">
                {employees.map(employee => (
                  <label key={employee.id} className="employee-checkbox-item">
                    <input 
                      type="checkbox"
                      checked={employeeIds.includes(employee.id)}
                      onChange={() => handleEmployeeToggle(employee.id)}
                    />
                    <span>{employee.name}</span>
                  </label>
                ))}
                {employees.length === 0 && (
                  <p className="no-data-text">Ingen medarbejdere tilgængelige</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Tilknyttet sag (valgfri)</label>
              <select 
                value={sagsnummer} 
                onChange={(e) => setSagsnummer(e.target.value)}
              >
                <option value="">-- Ingen sag --</option>
                {projects
                  .filter(p => p.status !== 'completed')
                  .map(project => (
                    <option key={project.id} value={project.sagsnummer}>
                      {getProjectDisplay(project)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Beskrivelse (valgfri)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tilføj detaljer om begivenheden..."
                rows="3"
              />
            </div>

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
              {loading ? 'Gemmer...' : (editEvent ? 'Gem ændringer' : 'Opret begivenhed')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarEventModal;