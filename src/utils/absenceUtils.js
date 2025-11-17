import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * FIRESTORE SCHEMA FOR ABSENCES
 * 
 * Collection: 'absences'
 * 
 * Fields:
 * - employeeId: string (required) - Document ID from employees collection
 * - employeeName: string (required) - Denormalized for easy display
 * - date: string (required) - Format: DD/MM/YYYY
 * - type: string (required) - "partial" | "single" | "extended"
 * - absenceReason: string (required) - "Feriedag" | "Feriefridag" | "Barn sygedag" | "Sygedag" | "Søgnehelligdag" | "Andet"
 * - hoursWorked: number (optional) - For partial absence only
 * - endDate: string (optional) - Format: DD/MM/YYYY - For extended absence only
 * - comment: string (optional) - Optional note
 * - createdAt: string (ISO timestamp)
 * - updatedAt: string (ISO timestamp)
 */

/**
 * Convert DD/MM/YYYY to Date object
 */
export function parseDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day);
}

/**
 * Convert Date object to DD/MM/YYYY
 */
export function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Create a new absence record
 */
export async function createAbsence(absenceData) {
  try {
    const docRef = await addDoc(collection(db, 'absences'), {
      ...absenceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating absence:', error);
    return { success: false, error };
  }
}

/**
 * Update an existing absence record
 */
export async function updateAbsence(absenceId, updateData) {
  try {
    const absenceRef = doc(db, 'absences', absenceId);
    await updateDoc(absenceRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating absence:', error);
    return { success: false, error };
  }
}

/**
 * Delete an absence record
 */
export async function deleteAbsence(absenceId) {
  try {
    await deleteDoc(doc(db, 'absences', absenceId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting absence:', error);
    return { success: false, error };
  }
}

/**
 * Get all absences for a specific employee
 */
export async function getEmployeeAbsences(employeeId) {
  try {
    const q = query(
      collection(db, 'absences'),
      where('employeeId', '==', employeeId)
    );
    
    const querySnapshot = await getDocs(q);
    const absences = [];
    
    querySnapshot.forEach((doc) => {
      absences.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, absences };
  } catch (error) {
    console.error('Error fetching employee absences:', error);
    return { success: false, error, absences: [] };
  }
}

/**
 * Get absences for a specific month
 */
export async function getAbsencesForMonth(employeeId, month, year) {
  try {
    const absencesResult = await getEmployeeAbsences(employeeId);
    if (!absencesResult.success) {
      return { success: false, absences: [] };
    }
    
    const filtered = absencesResult.absences.filter(absence => {
      const absenceDate = parseDate(absence.date);
      return absenceDate.getMonth() === month && absenceDate.getFullYear() === year;
    });
    
    return { success: true, absences: filtered };
  } catch (error) {
    console.error('Error fetching absences for month:', error);
    return { success: false, error, absences: [] };
  }
}

/**
 * Check if a specific date has an absence
 */
export function findAbsenceForDate(absences, dateString) {
  return absences.find(absence => {
    const absenceDate = absence.date;
    
    // Check if it's a single day absence or within an extended absence range
    if (absence.type === 'extended' && absence.endDate) {
      const startDate = parseDate(absence.date);
      const endDate = parseDate(absence.endDate);
      const checkDate = parseDate(dateString);
      
      return checkDate >= startDate && checkDate <= endDate;
    }
    
    // Single day or partial absence
    return absenceDate === dateString;
  });
}

/**
 * Get all dates affected by an extended absence
 */
export function getExtendedAbsenceDates(startDate, endDate) {
  const dates = [];
  const current = parseDate(startDate);
  const end = parseDate(endDate);
  
  while (current <= end) {
    dates.push(formatDate(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Create absence for all employees (lukkedag feature)
 */
export async function createAbsenceForAllEmployees(employees, absenceData) {
  try {
    const promises = employees.map(employee => 
      createAbsence({
        ...absenceData,
        employeeId: employee.id,
        employeeName: employee.name
      })
    );
    
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error('Error creating absence for all employees:', error);
    return { success: false, error };
  }
}

/**
 * Get absences for date range (used in PDF generation)
 */
export async function getAbsencesForDateRange(employeeId, startDate, endDate) {
  try {
    const absencesResult = await getEmployeeAbsences(employeeId);
    if (!absencesResult.success) {
      return { success: false, absences: [] };
    }
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    const filtered = absencesResult.absences.filter(absence => {
      const absenceDate = parseDate(absence.date);
      
      // Check if absence falls within the range
      if (absence.type === 'extended' && absence.endDate) {
        const absenceEnd = parseDate(absence.endDate);
        // Check if ranges overlap
        return (absenceDate <= end) && (absenceEnd >= start);
      }
      
      // Single day or partial absence
      return absenceDate >= start && absenceDate <= end;
    });
    
    return { success: true, absences: filtered };
  } catch (error) {
    console.error('Error fetching absences for date range:', error);
    return { success: false, error, absences: [] };
  }
}

/**
 * Calculate work hours for a date considering absence
 */
export function calculateWorkHours(dateString, weekday, absences) {
  const absence = findAbsenceForDate(absences, dateString);
  
  if (!absence) {
    // No absence - return standard hours
    if (weekday === 'Fredag') {
      return { worked: 7, minusLunch: 7 };
    } else {
      return { worked: 7.5, minusLunch: 7.5 };
    }
  }
  
  // There is an absence
  if (absence.type === 'partial') {
    // Partial absence - use specified hours
    return { 
      worked: absence.hoursWorked || 0, 
      minusLunch: absence.hoursWorked || 0 
    };
  }
  
  // Full day absence - no work hours
  return { worked: 0, minusLunch: 0 };
}

/**
 * Get absence comment for PDF with special formatting
 */
export function getAbsenceComment(dateString, weekday, absences) {
  const absence = findAbsenceForDate(absences, dateString);
  
  if (!absence) {
    return '';
  }
  
  // Calculate standard hours for the weekday
  const standardHours = weekday === 'Fredag' ? 7 : 7.5;
  
  let comment = '';
  
  // Special formatting based on absence reason
  switch (absence.absenceReason) {
    case 'Feriefridag':
      comment = 'Feriefri (FF) 1500 Kr.';
      break;
      
    case 'Søgnehelligdag':
      comment = 'Søgnehelligdag (SH) 1500 Kr.';
      break;
      
    case 'Barn sygedag':
      comment = `Barn sygedag: ${standardHours.toString().replace('.', ',')} timer`;
      break;
      
    case 'Sygedag':
      comment = `Sygedag: ${standardHours.toString().replace('.', ',')} timer`;
      break;
      
    default:
      // For other types (Feriedag, Andet) just use the reason
      comment = absence.absenceReason;
      break;
  }
  
  // Add optional comment if exists (except for special formatted types)
  if (absence.comment && !['Feriefridag', 'Søgnehelligdag', 'Barn sygedag', 'Sygedag'].includes(absence.absenceReason)) {
    comment += ` - ${absence.comment}`;
  }
  
  return comment;
}