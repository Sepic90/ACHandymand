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
import { 
  isSøgnehelligdag, 
  calculateSHCompensation, 
  getWeekdayFromDate 
} from './søgnehelligdageUtils';
import { addSHEntry, checkSHEntryExists } from './shAccumulationUtils';

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
 * Create SH accumulation entry when Søgnehelligdag absence is registered
 */
async function handleSHAccumulation(absenceData, employeeData) {
  // Only process if it's a Søgnehelligdag and employee has internal rate
  if (absenceData.absenceReason !== 'Søgnehelligdag') {
    return { success: true, message: 'Not a SH absence' };
  }

  if (!employeeData.internalHourlyRate || employeeData.internalHourlyRate <= 0) {
    console.warn('Employee has no internal hourly rate set - cannot calculate SH');
    return { success: false, message: 'No internal hourly rate' };
  }

  try {
    // Extract year from date
    const [day, month, year] = absenceData.date.split('/');
    const yearNum = parseInt(year);

    // Check if entry already exists
    const existsCheck = await checkSHEntryExists(
      employeeData.id,
      yearNum,
      absenceData.date
    );

    if (existsCheck.success && existsCheck.exists) {
      console.log('SH entry already exists for this date');
      return { success: true, message: 'Entry already exists' };
    }

    // Get weekday and calculate compensation
    const weekday = getWeekdayFromDate(absenceData.date);
    const amount = calculateSHCompensation(employeeData.internalHourlyRate, weekday);

    // Determine daily hours
    const dailyHours = weekday === 'Fredag' ? 7 : 7.5;

    // Get holiday name if it's a recognized holiday
    const holiday = isSøgnehelligdag(absenceData.date);
    const holidayName = holiday ? holiday.name : 'Søgnehelligdag';

    // Create SH entry
    const shResult = await addSHEntry(
      employeeData.id,
      employeeData.name,
      yearNum,
      {
        date: absenceData.date,
        holidayName: holidayName,
        amount: amount,
        hourlyRate: employeeData.internalHourlyRate,
        dailyHours: dailyHours
      }
    );

    if (shResult.success) {
      console.log('SH accumulation entry created successfully');
      return { success: true, message: 'SH entry created' };
    } else {
      console.error('Failed to create SH entry:', shResult.error);
      return { success: false, message: 'Failed to create SH entry' };
    }
  } catch (error) {
    console.error('Error in handleSHAccumulation:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Create a new absence record
 * Automatically creates SH accumulation if absence is Søgnehelligdag
 */
export async function createAbsence(absenceData, employeeData) {
  try {
    const docRef = await addDoc(collection(db, 'absences'), {
      ...absenceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Handle SH accumulation if applicable
    if (employeeData) {
      await handleSHAccumulation(absenceData, employeeData);
    }

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
    await updateDoc(doc(db, 'absences', absenceId), {
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
    
    // Sort by date descending
    absences.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });
    
    return { success: true, absences };
  } catch (error) {
    console.error('Error getting employee absences:', error);
    return { success: false, error, absences: [] };
  }
}

/**
 * Get absences for a specific date range
 */
export async function getAbsencesForDateRange(employeeId, startDate, endDate) {
  try {
    const result = await getEmployeeAbsences(employeeId);
    
    if (!result.success) {
      return result;
    }
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    const filteredAbsences = result.absences.filter(absence => {
      const absenceDate = parseDate(absence.date);
      
      // Handle extended absences
      if (absence.type === 'extended' && absence.endDate) {
        const absenceEndDate = parseDate(absence.endDate);
        // Check if date range overlaps with absence range
        return (absenceDate <= end && absenceEndDate >= start);
      }
      
      // Single day absence
      return absenceDate >= start && absenceDate <= end;
    });
    
    return { success: true, absences: filteredAbsences };
  } catch (error) {
    console.error('Error getting absences for date range:', error);
    return { success: false, error, absences: [] };
  }
}

/**
 * Find absence for a specific date
 */
export function findAbsenceForDate(absences, dateString) {
  return absences.find(absence => {
    // Handle extended absences
    if (absence.type === 'extended' && absence.endDate) {
      const startDate = parseDate(absence.date);
      const endDate = parseDate(absence.endDate);
      const checkDate = parseDate(dateString);
      return checkDate >= startDate && checkDate <= endDate;
    }
    
    // Single day or partial absence
    return absence.date === dateString;
  });
}

/**
 * Calculate work hours for a date considering absences
 */
export function calculateWorkHours(dateString, weekday, absences) {
  const absence = findAbsenceForDate(absences, dateString);
  
  // Standard hours based on weekday
  const standardHours = weekday === 'Fredag' ? 7 : (weekday === 'Lørdag' || weekday === 'Søndag') ? 0 : 7.5;
  const standardMinusLunch = weekday === 'Fredag' ? 7 : (weekday === 'Lørdag' || weekday === 'Søndag') ? 0 : 7.5;
  
  if (!absence) {
    return { 
      worked: standardHours,
      minusLunch: standardMinusLunch
    };
  }
  
  // Partial absence
  if (absence.type === 'partial') {
    const hoursWorked = absence.hoursWorked || 0;
    return {
      worked: hoursWorked,
      minusLunch: hoursWorked
    };
  }
  
  // Full day absence
  return {
    worked: 0,
    minusLunch: 0
  };
}

/**
 * Get absence comment for PDF display
 */
export function getAbsenceComment(dateString, weekday, absences) {
  const absence = findAbsenceForDate(absences, dateString);
  
  if (!absence) {
    return '';
  }
  
  const standardHours = weekday === 'Fredag' ? 7 : 7.5;
  
  switch (absence.absenceReason) {
    case 'Feriedag':
      return `Feriedag: ${standardHours} timer`;
    
    case 'Feriefridag':
      return 'Feriefri (FF) 1500 Kr.';
    
    case 'Barn sygedag':
      return `Barns sygedag (BS): ${standardHours} timer`;
    
    case 'Sygedag':
      return `Sygedag: ${standardHours} timer`;
    
    case 'Søgnehelligdag':
      // Calculate SH amount if possible
      return 'Søgnehelligdag (SH)';
    
    case 'Andet':
      return absence.comment || 'Fravær';
    
    default:
      return absence.absenceReason;
  }
}