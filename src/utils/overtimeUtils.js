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
 * FIRESTORE SCHEMA FOR OVERTIME
 * 
 * Collection: 'overtime'
 * 
 * Fields:
 * - employeeId: string (required) - Document ID from employees collection
 * - employeeName: string (required) - Denormalized for easy display
 * - date: string (required) - Format: DD/MM/YYYY
 * - hours: number (required) - Number of overtime hours (e.g., 2, 3.5)
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
 * Create a new overtime record
 */
export async function createOvertime(overtimeData) {
  try {
    const docRef = await addDoc(collection(db, 'overtime'), {
      ...overtimeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating overtime:', error);
    return { success: false, error };
  }
}

/**
 * Update an existing overtime record
 */
export async function updateOvertime(overtimeId, updateData) {
  try {
    const overtimeRef = doc(db, 'overtime', overtimeId);
    await updateDoc(overtimeRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating overtime:', error);
    return { success: false, error };
  }
}

/**
 * Delete an overtime record
 */
export async function deleteOvertime(overtimeId) {
  try {
    await deleteDoc(doc(db, 'overtime', overtimeId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting overtime:', error);
    return { success: false, error };
  }
}

/**
 * Get all overtime entries for a specific employee
 */
export async function getEmployeeOvertime(employeeId) {
  try {
    const q = query(
      collection(db, 'overtime'),
      where('employeeId', '==', employeeId)
    );
    
    const querySnapshot = await getDocs(q);
    const overtime = [];
    
    querySnapshot.forEach((doc) => {
      overtime.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, overtime };
  } catch (error) {
    console.error('Error fetching employee overtime:', error);
    return { success: false, error, overtime: [] };
  }
}

/**
 * Get overtime for a specific month
 */
export async function getOvertimeForMonth(employeeId, month, year) {
  try {
    const overtimeResult = await getEmployeeOvertime(employeeId);
    if (!overtimeResult.success) {
      return { success: false, overtime: [] };
    }
    
    const filtered = overtimeResult.overtime.filter(ot => {
      const otDate = parseDate(ot.date);
      return otDate.getMonth() === month && otDate.getFullYear() === year;
    });
    
    return { success: true, overtime: filtered };
  } catch (error) {
    console.error('Error fetching overtime for month:', error);
    return { success: false, error, overtime: [] };
  }
}

/**
 * Check if a specific date has overtime
 */
export function findOvertimeForDate(overtimeEntries, dateString) {
  return overtimeEntries.find(ot => ot.date === dateString);
}

/**
 * Get overtime for date range (used in PDF generation)
 */
export async function getOvertimeForDateRange(employeeId, startDate, endDate) {
  try {
    const overtimeResult = await getEmployeeOvertime(employeeId);
    if (!overtimeResult.success) {
      return { success: false, overtime: [] };
    }
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    const filtered = overtimeResult.overtime.filter(ot => {
      const otDate = parseDate(ot.date);
      return otDate >= start && otDate <= end;
    });
    
    return { success: true, overtime: filtered };
  } catch (error) {
    console.error('Error fetching overtime for date range:', error);
    return { success: false, error, overtime: [] };
  }
}

/**
 * Calculate total overtime hours for a date
 */
export function getOvertimeHours(dateString, overtimeEntries) {
  const overtime = findOvertimeForDate(overtimeEntries, dateString);
  return overtime ? overtime.hours : 0;
}