/**
 * DANISH PUBLIC HOLIDAYS (SØGNEHELLIGDAGE) UTILITIES
 * 
 * This utility calculates all Danish public holidays for any given year
 * and provides functions to check if a date is a holiday and calculate
 * the 14.7% compensation amount for employees.
 */

/**
 * Calculate Easter Sunday for a given year using the Anonymous Gregorian algorithm
 * Returns a Date object for Easter Sunday
 */
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Calculate all Danish public holidays (søgnehelligdage) for a given year
 * Returns an array of objects with date, name, and formatted date string
 */
export function getDanishPublicHolidays(year) {
  const holidays = [];
  
  // Fixed holidays
  holidays.push({
    date: new Date(year, 0, 1), // January 1
    name: 'Nytårsdag',
    formattedDate: '01/01/' + year
  });
  
  holidays.push({
    date: new Date(year, 11, 25), // December 25
    name: 'Juledag',
    formattedDate: '25/12/' + year
  });
  
  holidays.push({
    date: new Date(year, 11, 26), // December 26
    name: '2. juledag',
    formattedDate: '26/12/' + year
  });
  
  // Calculate Easter-based holidays
  const easter = calculateEaster(year);
  
  // Skærtorsdag (Maundy Thursday) - 3 days before Easter
  const maundyThursday = new Date(easter);
  maundyThursday.setDate(easter.getDate() - 3);
  holidays.push({
    date: maundyThursday,
    name: 'Skærtorsdag',
    formattedDate: formatDateDDMMYYYY(maundyThursday)
  });
  
  // Langfredag (Good Friday) - 2 days before Easter
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({
    date: goodFriday,
    name: 'Langfredag',
    formattedDate: formatDateDDMMYYYY(goodFriday)
  });
  
  // Påskedag (Easter Sunday)
  holidays.push({
    date: new Date(easter),
    name: 'Påskedag',
    formattedDate: formatDateDDMMYYYY(easter)
  });
  
  // 2. påskedag (Easter Monday) - 1 day after Easter
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push({
    date: easterMonday,
    name: '2. påskedag',
    formattedDate: formatDateDDMMYYYY(easterMonday)
  });
  
  // Kristi Himmelfartsdag (Ascension Day) - 39 days after Easter
  const ascensionDay = new Date(easter);
  ascensionDay.setDate(easter.getDate() + 39);
  holidays.push({
    date: ascensionDay,
    name: 'Kristi Himmelfartsdag',
    formattedDate: formatDateDDMMYYYY(ascensionDay)
  });
  
  // Pinsedag (Whit Sunday) - 49 days after Easter
  const whitSunday = new Date(easter);
  whitSunday.setDate(easter.getDate() + 49);
  holidays.push({
    date: whitSunday,
    name: 'Pinsedag',
    formattedDate: formatDateDDMMYYYY(whitSunday)
  });
  
  // 2. pinsedag (Whit Monday) - 50 days after Easter
  const whitMonday = new Date(easter);
  whitMonday.setDate(easter.getDate() + 50);
  holidays.push({
    date: whitMonday,
    name: '2. pinsedag',
    formattedDate: formatDateDDMMYYYY(whitMonday)
  });
  
  // Sort by date
  holidays.sort((a, b) => a.date - b.date);
  
  return holidays;
}

/**
 * Check if a specific date (DD/MM/YYYY format) is a Danish public holiday
 * Returns the holiday object if true, null if false
 */
export function isSøgnehelligdag(dateString) {
  // Parse the date string
  const [day, month, yearStr] = dateString.split('/');
  const year = parseInt(yearStr);
  
  // Get all holidays for this year
  const holidays = getDanishPublicHolidays(year);
  
  // Check if the date matches any holiday
  const match = holidays.find(holiday => holiday.formattedDate === dateString);
  
  return match || null;
}

/**
 * Calculate the 14.7% SH compensation for an employee
 * 
 * @param {number} internalHourlyRate - Employee's hourly rate in DKK
 * @param {string} weekday - Danish weekday name (e.g., "Mandag", "Fredag")
 * @returns {number} Compensation amount rounded to 2 decimals
 */
export function calculateSHCompensation(internalHourlyRate, weekday) {
  if (!internalHourlyRate || internalHourlyRate <= 0) {
    return 0;
  }
  
  // Determine daily hours based on weekday
  let dailyHours;
  if (weekday === 'Fredag') {
    dailyHours = 7; // 07:00-14:30 with 30min lunch
  } else if (['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag'].includes(weekday)) {
    dailyHours = 7.5; // 07:00-15:00 with 30min lunch
  } else {
    // Weekend - should not happen for SH, but default to 0
    return 0;
  }
  
  // Calculate: (hourly rate × daily hours) × 14.7%
  const compensation = (internalHourlyRate * dailyHours) * 0.147;
  
  // Round to 2 decimal places
  return Math.round(compensation * 100) / 100;
}

/**
 * Get Danish weekday name from a date string (DD/MM/YYYY)
 */
export function getWeekdayFromDate(dateString) {
  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);
  
  const weekdays = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
  return weekdays[date.getDay()];
}

/**
 * Helper function to format Date object as DD/MM/YYYY
 */
function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get all søgnehelligdage for a date range
 * Useful for checking multiple dates at once
 */
export function getSøgnehelligdageInRange(startDate, endDate) {
  const [startDay, startMonth, startYear] = startDate.split('/');
  const [endDay, endMonth, endYear] = endDate.split('/');
  
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  const years = new Set();
  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    years.add(year);
  }
  
  const allHolidays = [];
  years.forEach(year => {
    const holidays = getDanishPublicHolidays(year);
    allHolidays.push(...holidays);
  });
  
  // Filter to only holidays in range
  return allHolidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= start && holidayDate <= end;
  });
}