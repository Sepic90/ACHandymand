// Danish weekday names
const WEEKDAYS_DA = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

// Danish month names
const MONTHS_DA = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
];

/**
 * Get the weekday name in Danish
 */
export function getWeekdayName(date) {
  return WEEKDAYS_DA[date.getDay()];
}

/**
 * Get the month name in Danish
 */
export function getMonthName(monthIndex) {
  return MONTHS_DA[monthIndex];
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Generate all dates from 20th of startMonth to 19th of next month
 */
export function generateDateRange(year, startMonthIndex) {
  const dates = [];
  
  // Start from the 20th of the selected month
  let currentDate = new Date(year, startMonthIndex, 20);
  
  // End on the 19th of the next month
  const endMonth = startMonthIndex === 11 ? 0 : startMonthIndex + 1;
  const endYear = startMonthIndex === 11 ? year + 1 : year;
  const endDate = new Date(endYear, endMonth, 19);
  
  // Generate all dates in the range
  while (currentDate <= endDate) {
    dates.push({
      date: new Date(currentDate),
      dayOfMonth: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      weekday: getWeekdayName(currentDate),
      isWeekend: isWeekend(currentDate),
      formattedDate: `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Get the month pair for display (e.g., "Oktober / November")
 */
export function getMonthPairLabel(startMonthIndex) {
  const endMonthIndex = startMonthIndex === 11 ? 0 : startMonthIndex + 1;
  return `${MONTHS_DA[startMonthIndex]} / ${MONTHS_DA[endMonthIndex]}`;
}

/**
 * Get the year(s) for title (e.g., "2025" or "2025 / 2026")
 */
export function getYearLabel(year, startMonthIndex) {
  if (startMonthIndex === 11) {
    // December/January spans two years
    return `${year} / ${year + 1}`;
  }
  return String(year);
}

/**
 * Generate month pair options for a given year
 */
export function generateMonthPairs() {
  return MONTHS_DA.map((month, index) => {
    const nextIndex = index === 11 ? 0 : index + 1;
    return {
      value: index,
      label: `${month} / ${MONTHS_DA[nextIndex]}`
    };
  });
}
