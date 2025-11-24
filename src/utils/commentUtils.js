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
 * FIRESTORE SCHEMA FOR TIMESHEET COMMENTS
 * 
 * Collection: 'timesheetComments'
 * 
 * Document ID format: '{employeeId}_{date}' (e.g., 'abc123_01/01/2025')
 * 
 * Fields:
 * - employeeId: string (required) - Document ID from employees collection
 * - employeeName: string (required) - Denormalized for easy display
 * - date: string (required) - Format: DD/MM/YYYY
 * - comment: string (required) - The comment text to appear on PDF
 * - createdAt: string (ISO timestamp)
 * - updatedAt: string (ISO timestamp)
 * 
 * Note: Comments have priority over automatic absence comments in PDF generation.
 * Max length should be controlled to fit within PDF column width.
 */

/**
 * Create or update a timesheet comment
 * Uses upsert pattern - creates if doesn't exist, updates if it does
 */
export async function upsertTimesheetComment(employeeId, employeeName, date, comment) {
  try {
    const docId = `${employeeId}_${date.replace(/\//g, '-')}`;
    const docRef = doc(db, 'timesheetComments', docId);
    
    const commentData = {
      employeeId,
      employeeName,
      date,
      comment: comment.trim(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing
      await updateDoc(docRef, commentData);
    } else {
      // Create new
      await setDoc(docRef, {
        ...commentData,
        createdAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error upserting timesheet comment:', error);
    return { success: false, error };
  }
}

/**
 * Get a timesheet comment for a specific date
 */
export async function getTimesheetComment(employeeId, date) {
  try {
    const docId = `${employeeId}_${date.replace(/\//g, '-')}`;
    const docRef = doc(db, 'timesheetComments', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, comment: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: true, comment: null };
    }
  } catch (error) {
    console.error('Error getting timesheet comment:', error);
    return { success: false, error };
  }
}

/**
 * Get all timesheet comments for an employee
 */
export async function getEmployeeTimesheetComments(employeeId) {
  try {
    const q = query(
      collection(db, 'timesheetComments'),
      where('employeeId', '==', employeeId)
    );
    
    const querySnapshot = await getDocs(q);
    const comments = [];
    
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending
    comments.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateB - dateA;
    });
    
    return { success: true, comments };
  } catch (error) {
    console.error('Error getting employee timesheet comments:', error);
    return { success: false, error, comments: [] };
  }
}

/**
 * Get timesheet comments for a date range
 */
export async function getTimesheetCommentsForDateRange(employeeId, startDate, endDate) {
  try {
    const result = await getEmployeeTimesheetComments(employeeId);
    
    if (!result.success) {
      return result;
    }
    
    const [startDay, startMonth, startYear] = startDate.split('/');
    const [endDay, endMonth, endYear] = endDate.split('/');
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    const filteredComments = result.comments.filter(comment => {
      const [day, month, year] = comment.date.split('/');
      const commentDate = new Date(year, month - 1, day);
      return commentDate >= start && commentDate <= end;
    });
    
    return { success: true, comments: filteredComments };
  } catch (error) {
    console.error('Error getting comments for date range:', error);
    return { success: false, error, comments: [] };
  }
}

/**
 * Delete a timesheet comment
 */
export async function deleteTimesheetComment(employeeId, date) {
  try {
    const docId = `${employeeId}_${date.replace(/\//g, '-')}`;
    await deleteDoc(doc(db, 'timesheetComments', docId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting timesheet comment:', error);
    return { success: false, error };
  }
}

/**
 * Check if a timesheet comment exists for a specific date
 */
export async function checkTimesheetCommentExists(employeeId, date) {
  try {
    const result = await getTimesheetComment(employeeId, date);
    return { success: true, exists: result.comment !== null };
  } catch (error) {
    console.error('Error checking timesheet comment existence:', error);
    return { success: false, error };
  }
}

/**
 * Get comment text for a specific date (used in PDF generation)
 * Returns the comment text or null if no comment exists
 */
export async function getCommentForDate(employeeId, date) {
  try {
    const result = await getTimesheetComment(employeeId, date);
    if (result.success && result.comment) {
      return result.comment.comment;
    }
    return null;
  } catch (error) {
    console.error('Error getting comment for date:', error);
    return null;
  }
}