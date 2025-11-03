import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// Get next project number for current year
export const getNextProjectNumber = async (year) => {
  const counterRef = doc(db, 'projectCounter', String(year));
  
  try {
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      const currentNumber = counterDoc.data().currentNumber || 0;
      const nextNumber = currentNumber + 1;
      
      // Update counter
      await setDoc(counterRef, { currentNumber: nextNumber });
      
      return formatProjectNumber(year, nextNumber);
    } else {
      // Initialize counter for new year
      await setDoc(counterRef, { currentNumber: 1 });
      return formatProjectNumber(year, 1);
    }
  } catch (error) {
    console.error('Error getting next project number:', error);
    throw error;
  }
};

// Format project number (e.g., 2025-0001)
export const formatProjectNumber = (year, number) => {
  const paddedNumber = String(number).padStart(4, '0');
  return `${year}-${paddedNumber}`;
};

// Calculate total hours for project
export const calculateTotalHours = (timeEntries) => {
  if (!timeEntries || timeEntries.length === 0) return 0;
  return timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
};

// Calculate billable hours for project
export const calculateBillableHours = (timeEntries) => {
  if (!timeEntries || timeEntries.length === 0) return 0;
  return timeEntries
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0);
};

// Calculate total value for project (billable entries only)
export const calculateTotalValue = (timeEntries) => {
  if (!timeEntries || timeEntries.length === 0) return 0;
  return timeEntries
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + ((entry.duration || 0) * (entry.rate || 0)), 0);
};

// Get all time entries for a project
export const getProjectTimeEntries = async (projectId) => {
  try {
    const q = query(
      collection(db, 'timeEntries'),
      where('projectId', '==', projectId)
    );
    
    const querySnapshot = await getDocs(q);
    const entries = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return entries;
  } catch (error) {
    console.error('Error getting project time entries:', error);
    throw error;
  }
};

// Validate email format
export const isValidEmail = (email) => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format
export const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 8; // Danish phone numbers are 8 digits
};