import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNotification } from '../utils/notificationUtils';
import CalendarEventModal from '../components/CalendarEventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import {
  MONTHS_DA,
  WEEKDAYS_DA_SHORT,
  getFirstDayOfMonth,
  getDaysInMonth,
  isToday,
  formatDateDDMMYYYY,
  getEmployeeColor,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getMonthEvents,
  getMonthAbsences,
  getEventsForDate,
  getAbsencesForDate,
  combineEventsAndAbsences
} from '../utils/calendarUtils';

function Kalender() {
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDateAbsences, setSelectedDateAbsences] = useState([]);
  const [editEvent, setEditEvent] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadEmployees();
    loadProjects();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadEvents(),
      loadAbsences()
    ]);
    setLoading(false);
  };

  const loadEvents = async () => {
    const result = await getMonthEvents(currentYear, currentMonth);
    if (result.success) {
      setEvents(result.events);
    } else {
      showError('Fejl ved indlæsning af begivenheder.');
    }
  };

  const loadAbsences = async () => {
    if (employees.length === 0) {
      return;
    }
    
    const result = await getMonthAbsences(employees, currentYear, currentMonth);
    if (result.success) {
      setAbsences(result.absences);
    } else {
      console.error('Error loading absences');
    }
  };

  const loadEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeeList = [];
      querySnapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectList = [];
      querySnapshot.forEach((doc) => {
        projectList.push({ id: doc.id, ...doc.data() });
      });
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      loadAbsences();
    }
  }, [employees]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleDateClick = (day) => {
    const dateString = formatDateDDMMYYYY(new Date(currentYear, currentMonth, day));
    setSelectedDate(dateString);
    
    const dayEvents = getEventsForDate(events, dateString);
    const dayAbsences = getAbsencesForDate(absences, dateString);
    
    if (dayEvents.length > 0 || dayAbsences.length > 0) {
      setSelectedDateEvents(dayEvents);
      setSelectedDateAbsences(dayAbsences);
      setDetailsModalOpen(true);
    } else {
      setEditEvent(null);
      setModalOpen(true);
    }
  };

  const handleCreateEvent = () => {
    setSelectedDate(null);
    setEditEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditEvent(event);
    setModalOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    if (editEvent) {
      const result = await updateCalendarEvent(editEvent.id, eventData);
      if (result.success) {
        showSuccess('Begivenhed opdateret!');
        loadEvents();
      } else {
        showError('Fejl ved opdatering af begivenhed.');
      }
    } else {
      const result = await createCalendarEvent(eventData);
      if (result.success) {
        showSuccess('Begivenhed oprettet!');
        loadEvents();
      } else {
        showError('Fejl ved oprettelse af begivenhed.');
      }
    }
  };

  const handleDeleteEvent = async (event) => {
    const confirmed = await showConfirm({
      title: 'Slet begivenhed',
      message: 'Er du sikker på at du vil slette denne begivenhed?',
      confirmText: 'Slet',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    const result = await deleteCalendarEvent(event.id);
    if (result.success) {
      showSuccess('Begivenhed slettet!');
      loadEvents();
      setDetailsModalOpen(false);
    } else {
      showError('Fejl ved sletning af begivenhed.');
    }
  };

  const renderCalendarGrid = () => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateDDMMYYYY(new Date(currentYear, currentMonth, day));
      const dayEvents = getEventsForDate(events, dateString);
      const dayAbsences = getAbsencesForDate(absences, dateString);
      const allItems = combineEventsAndAbsences(dayEvents, dayAbsences);
      const hasItems = allItems.length > 0;
      const isTodayDate = isToday(currentYear, currentMonth, day);

      days.push(
        <div
          key={day}
          className={`calendar-day ${hasItems ? 'has-events' : ''} ${isTodayDate ? 'today' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="calendar-day-number">{day}</div>
          {hasItems && (
            <div className="calendar-day-indicators">
              {allItems.slice(0, 3).map((item, idx) => {
                const color = item.isAbsence 
                  ? '#f57c00' 
                  : getEmployeeColor(item.employeeIds?.[0] || item.employeeId);
                
                return (
                  <div
                    key={idx}
                    className="calendar-event-dot"
                    style={{ backgroundColor: color }}
                    title={item.title}
                  />
                );
              })}
              {allItems.length > 3 && (
                <span className="calendar-more-indicator">+{allItems.length - 3}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div>
      <div className="page-header-friendly">
        <div className="welcome-section">
          <h1>📅 Kalender</h1>
          <p className="welcome-subtitle">Plan og oversigt over arbejde og fravær</p>
        </div>
      </div>

      <div className="content-card">
        <div className="calendar-header-controls">
          <button className="btn-secondary" onClick={handlePreviousMonth}>
            ← Forrige
          </button>
          <div className="calendar-title">
            <h2>{MONTHS_DA[currentMonth]} {currentYear}</h2>
          </div>
          <button className="btn-secondary" onClick={handleNextMonth}>
            Næste →
          </button>
        </div>

        <div className="calendar-quick-actions">
          <button className="btn-secondary btn-small" onClick={handleToday}>
            I dag
          </button>
          <button className="btn-primary" onClick={handleCreateEvent}>
            + Opret begivenhed
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>Indlæser kalender...</p>
          </div>
        ) : (
          <>
            <div className="calendar-weekdays">
              {WEEKDAYS_DA_SHORT.map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {renderCalendarGrid()}
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <CalendarEventModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveEvent}
          editEvent={editEvent}
          selectedDate={selectedDate}
          employees={employees}
          projects={projects}
        />
      )}

      {detailsModalOpen && (
        <EventDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          selectedDate={selectedDate}
          events={selectedDateEvents}
          absences={selectedDateAbsences}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
    </div>
  );
}

export default Kalender;