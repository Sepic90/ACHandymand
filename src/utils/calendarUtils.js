import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getEmployeeAbsences } from './absenceUtils';

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get Danish month name
 */
export const MONTHS_DA = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
];

/**
 * Get Danish weekday names (short)
 */
export const WEEKDAYS_DA_SHORT = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

/**
 * Format date as DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse DD/MM/YYYY to Date object
 */
export function parseDateDDMMYYYY(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day);
}

/**
 * Get first day of month (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstDayOfMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  // Convert Sunday (0) to 7 for Monday-first week
  return firstDay === 0 ? 6 : firstDay - 1;
}

/**
 * Get number of days in month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if date is today
 */
export function isToday(year, month, day) {
  const today = new Date();
  return today.getFullYear() === year && 
         today.getMonth() === month && 
         today.getDate() === day;
}

/**
 * Format time as HH:MM
 */
export function formatTime(time) {
  if (!time) return '';
  return time.substring(0, 5); // Extract HH:MM from HH:MM:SS or HH:MM
}

/**
 * Get ISO date string (YYYY-MM-DD)
 */
export function getISODate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// ============================================
// EMPLOYEE COLOR CODING
// ============================================

const EMPLOYEE_COLORS = [
  '#5B8DBE', // Medium blue
  '#7A9D54', // Olive green
  '#CD7672', // Dusty rose
  '#8B7FB8', // Muted purple
  '#CC8E5E', // Terracotta
  '#5B9D9D', // Teal
  '#9D6B8B', // Mauve
  '#7B8D5B', // Sage green
  '#8B6B5B', // Warm brown
  '#6B7B9D', // Slate blue
  '#9D7B5B', // Sandy brown
  '#6B9D7B', // Forest green
];

/**
 * Get consistent color for employee based on ID
 */
export function getEmployeeColor(employeeId) {
  if (!employeeId) return EMPLOYEE_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = employeeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % EMPLOYEE_COLORS.length;
  return EMPLOYEE_COLORS[index];
}

/**
 * Get lighter version of color for backgrounds
 */
export function getLighterColor(color, opacity = 0.2) {
  // Convert hex to rgba with opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ============================================
// CALENDAR EVENT MANAGEMENT
// ============================================

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(eventData) {
  try {
    const docRef = await addDoc(collection(db, 'calendar_events'), {
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error };
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(eventId, updateData) {
  try {
    await updateDoc(doc(db, 'calendar_events', eventId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { success: false, error };
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(eventId) {
  try {
    await deleteDoc(doc(db, 'calendar_events', eventId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error };
  }
}

/**
 * Get all events for a specific month
 */
export async function getMonthEvents(year, month) {
  try {
    // Get first and last day of month for query range
    const firstDay = `01/${String(month + 1).padStart(2, '0')}/${year}`;
    const lastDay = `${getDaysInMonth(year, month)}/${String(month + 1).padStart(2, '0')}/${year}`;
    
    const querySnapshot = await getDocs(collection(db, 'calendar_events'));
    const events = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = parseDateDDMMYYYY(data.date);
      const firstDate = parseDateDDMMYYYY(firstDay);
      const lastDate = parseDateDDMMYYYY(lastDay);
      
      // Include event if it falls within the month
      if (eventDate >= firstDate && eventDate <= lastDate) {
        events.push({ id: doc.id, ...data });
      }
    });
    
    return { success: true, events };
  } catch (error) {
    console.error('Error loading month events:', error);
    return { success: false, error, events: [] };
  }
}

/**
 * Get all events for a specific date
 */
export function getEventsForDate(events, dateString) {
  return events.filter(event => event.date === dateString);
}

/**
 * Get all absences for a specific month (from all employees)
 */
export async function getMonthAbsences(employees, year, month) {
  try {
    const allAbsences = [];
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Fetch absences for each employee
    for (const employee of employees) {
      const result = await getEmployeeAbsences(employee.id);
      if (result.success && result.absences) {
        // Filter absences for this month
        const monthAbsences = result.absences.filter(absence => {
          const absenceDate = parseDateDDMMYYYY(absence.date);
          return absenceDate >= firstDay && absenceDate <= lastDay;
        });
        
        // Add employee info to each absence
        monthAbsences.forEach(absence => {
          allAbsences.push({
            ...absence,
            employeeName: employee.name,
            employeeId: employee.id,
            type: 'absence' // Mark as absence type for calendar display
          });
        });
      }
    }
    
    return { success: true, absences: allAbsences };
  } catch (error) {
    console.error('Error loading month absences:', error);
    return { success: false, error, absences: [] };
  }
}

/**
 * Get absences for a specific date
 */
export function getAbsencesForDate(absences, dateString) {
  return absences.filter(absence => {
    // Handle extended absences
    if (absence.type === 'extended' && absence.endDate) {
      const startDate = parseDateDDMMYYYY(absence.date);
      const endDate = parseDateDDMMYYYY(absence.endDate);
      const checkDate = parseDateDDMMYYYY(dateString);
      return checkDate >= startDate && checkDate <= endDate;
    }
    
    // Single day or partial absence
    return absence.date === dateString;
  });
}

/**
 * Combine events and absences for calendar display
 */
export function combineEventsAndAbsences(events, absences) {
  // Map absences to calendar event format
  const absenceEvents = absences.map(absence => ({
    id: `absence-${absence.id}`,
    title: `${absence.employeeName} - ${absence.absenceReason}`,
    date: absence.date,
    type: 'absence',
    employeeId: absence.employeeId,
    employeeName: absence.employeeName,
    absenceReason: absence.absenceReason,
    isAbsence: true,
    originalData: absence
  }));
  
  return [...events, ...absenceEvents];
}