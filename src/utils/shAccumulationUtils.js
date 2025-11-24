import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  setDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * FIRESTORE SCHEMA FOR SH ACCUMULATION
 * 
 * Collection: 'shAccumulation'
 * 
 * Document ID format: '{employeeId}_{year}' (e.g., 'abc123_2025')
 * 
 * Fields:
 * - employeeId: string (required) - Document ID from employees collection
 * - employeeName: string (required) - Denormalized for easy display
 * - year: number (required) - Year of accumulation (e.g., 2025)
 * - accumulatedAmount: number (required) - Total accumulated SH amount in DKK
 * - isPaidOut: boolean (default: false) - Whether December payout has been made
 * - paidOutDate: string (optional) - ISO timestamp of payout
 * - entries: array of objects (required) - Individual SH entries
 *   Each entry object:
 *   - date: string (DD/MM/YYYY format)
 *   - holidayName: string (e.g., "Juledag", "Påskedag")
 *   - amount: number (compensation amount in DKK)
 *   - hourlyRate: number (employee's rate at time of calculation)
 *   - dailyHours: number (7 or 7.5 depending on weekday)
 *   - createdAt: string (ISO timestamp)
 * - createdAt: string (ISO timestamp)
 * - updatedAt: string (ISO timestamp)
 */

/**
 * Get or create SH accumulation document for an employee and year
 */
export async function getOrCreateSHAccumulation(employeeId, employeeName, year) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    
    // Create new document if it doesn't exist
    const newDoc = {
      employeeId,
      employeeName,
      year,
      accumulatedAmount: 0,
      isPaidOut: false,
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(docRef, newDoc);
    
    return { success: true, data: { id: docId, ...newDoc } };
  } catch (error) {
    console.error('Error getting/creating SH accumulation:', error);
    return { success: false, error };
  }
}

/**
 * Add a new SH entry to an employee's accumulation
 */
export async function addSHEntry(employeeId, employeeName, year, entryData) {
  try {
    // Get or create the accumulation document
    const result = await getOrCreateSHAccumulation(employeeId, employeeName, year);
    
    if (!result.success) {
      return result;
    }
    
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    
    // Check if entry for this date already exists
    const existingEntries = result.data.entries || [];
    const existingIndex = existingEntries.findIndex(e => e.date === entryData.date);
    
    if (existingIndex !== -1) {
      return { 
        success: false, 
        error: 'En SH-registrering eksisterer allerede for denne dato' 
      };
    }
    
    // Create new entry with timestamp
    const newEntry = {
      ...entryData,
      createdAt: new Date().toISOString()
    };
    
    // Add to entries array
    const updatedEntries = [...existingEntries, newEntry];
    
    // Recalculate total
    const newTotal = updatedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Update document
    await updateDoc(docRef, {
      entries: updatedEntries,
      accumulatedAmount: Math.round(newTotal * 100) / 100,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, entry: newEntry };
  } catch (error) {
    console.error('Error adding SH entry:', error);
    return { success: false, error };
  }
}

/**
 * Update an existing SH entry
 */
export async function updateSHEntry(employeeId, year, date, updatedData) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'SH accumulation document not found' };
    }
    
    const data = docSnap.data();
    const entries = data.entries || [];
    const entryIndex = entries.findIndex(e => e.date === date);
    
    if (entryIndex === -1) {
      return { success: false, error: 'Entry not found for this date' };
    }
    
    // Update the entry
    entries[entryIndex] = {
      ...entries[entryIndex],
      ...updatedData
    };
    
    // Recalculate total
    const newTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Update document
    await updateDoc(docRef, {
      entries: entries,
      accumulatedAmount: Math.round(newTotal * 100) / 100,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating SH entry:', error);
    return { success: false, error };
  }
}

/**
 * Delete an SH entry
 */
export async function deleteSHEntry(employeeId, year, date) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'SH accumulation document not found' };
    }
    
    const data = docSnap.data();
    const entries = data.entries || [];
    
    // Filter out the entry
    const updatedEntries = entries.filter(e => e.date !== date);
    
    if (updatedEntries.length === entries.length) {
      return { success: false, error: 'Entry not found for this date' };
    }
    
    // Recalculate total
    const newTotal = updatedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Update document
    await updateDoc(docRef, {
      entries: updatedEntries,
      accumulatedAmount: Math.round(newTotal * 100) / 100,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting SH entry:', error);
    return { success: false, error };
  }
}

/**
 * Get SH accumulation for an employee for a specific year
 */
export async function getSHAccumulation(employeeId, year) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Return empty structure if no accumulation exists yet
      return { 
        success: true, 
        data: {
          employeeId,
          year,
          accumulatedAmount: 0,
          isPaidOut: false,
          entries: []
        }
      };
    }
    
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error('Error getting SH accumulation:', error);
    return { success: false, error };
  }
}

/**
 * Get all SH accumulations for an employee (all years)
 */
export async function getAllEmployeeSHAccumulations(employeeId) {
  try {
    const q = query(
      collection(db, 'shAccumulation'),
      where('employeeId', '==', employeeId)
    );
    
    const querySnapshot = await getDocs(q);
    const accumulations = [];
    
    querySnapshot.forEach((doc) => {
      accumulations.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by year descending (most recent first)
    accumulations.sort((a, b) => b.year - a.year);
    
    return { success: true, accumulations };
  } catch (error) {
    console.error('Error getting employee SH accumulations:', error);
    return { success: false, error };
  }
}

/**
 * Mark accumulation as paid out
 */
export async function markSHAsPaidOut(employeeId, year) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    
    await updateDoc(docRef, {
      isPaidOut: true,
      paidOutDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking SH as paid out:', error);
    return { success: false, error };
  }
}

/**
 * Unmark accumulation as paid out (undo payout)
 */
export async function unmarkSHAsPaidOut(employeeId, year) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    
    await updateDoc(docRef, {
      isPaidOut: false,
      paidOutDate: null,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error unmarking SH as paid out:', error);
    return { success: false, error };
  }
}

/**
 * Check if an SH entry already exists for a specific date
 */
export async function checkSHEntryExists(employeeId, year, date) {
  try {
    const docId = `${employeeId}_${year}`;
    const docRef = doc(db, 'shAccumulation', docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: true, exists: false };
    }
    
    const data = docSnap.data();
    const entries = data.entries || [];
    const exists = entries.some(e => e.date === date);
    
    return { success: true, exists };
  } catch (error) {
    console.error('Error checking SH entry existence:', error);
    return { success: false, error };
  }
}