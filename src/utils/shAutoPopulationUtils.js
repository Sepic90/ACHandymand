import { getDanishPublicHolidays } from './shHolidayUtils';
import { createAbsence } from './absenceUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * AUTO-POPULATION OF SØGNEHELLIGDAGE (SH) ABSENCES
 * 
 * This utility automatically creates absence entries for all Danish public holidays
 * for all employees in the system. It runs automatically when the app loads and
 * checks if the current year and next year are populated.
 * 
 * - Creates 10 SH absences per employee per year
 * - Skips if absence already exists for that date/employee
 * - Automatically triggers SH accumulation (14.7% calculation)
 */

/**
 * Check if SH absence already exists for a specific employee and date
 */
async function checkSHAbsenceExists(employeeId, date) {
  try {
    const q = query(
      collection(db, 'absences'),
      where('employeeId', '==', employeeId),
      where('date', '==', date),
      where('absenceReason', '==', 'Søgnehelligdag')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking SH absence existence:', error);
    return false;
  }
}

/**
 * Populate SH absences for a specific year for all employees
 */
export async function populateSHForYear(year, employees) {
  console.log(`\n=== POPULATING SØGNEHELLIGDAGE FOR ${year} ===`);
  
  if (!employees || employees.length === 0) {
    console.log('No employees to populate SH for');
    return { success: true, created: 0, skipped: 0, message: 'No employees' };
  }
  
  // Get all Danish public holidays for this year
  const holidays = getDanishPublicHolidays(year);
  console.log(`Found ${holidays.length} holidays for ${year}:`, holidays.map(h => h.name).join(', '));
  
  let totalCreated = 0;
  let totalSkipped = 0;
  let errors = [];
  
  // For each employee
  for (const employee of employees) {
    console.log(`\nProcessing ${employee.name} (ID: ${employee.id})`);
    let employeeCreated = 0;
    let employeeSkipped = 0;
    
    // For each holiday
    for (const holiday of holidays) {
      try {
        // Check if absence already exists
        const exists = await checkSHAbsenceExists(employee.id, holiday.formattedDate);
        
        if (exists) {
          console.log(`  ⏭️  Skipping ${holiday.name} (${holiday.formattedDate}) - already exists`);
          employeeSkipped++;
          totalSkipped++;
          continue;
        }
        
        // Create SH absence
        const absenceData = {
          employeeId: employee.id,
          employeeName: employee.name,
          date: holiday.formattedDate,
          type: 'single',
          absenceReason: 'Søgnehelligdag',
          comment: `Automatisk registreret: ${holiday.name}`
        };
        
        // Create absence (this will also trigger SH accumulation if employee has hourly rate)
        const result = await createAbsence(absenceData, employee);
        
        if (result.success) {
          console.log(`  ✅ Created ${holiday.name} (${holiday.formattedDate})`);
          employeeCreated++;
          totalCreated++;
        } else {
          console.error(`  ❌ Failed to create ${holiday.name}:`, result.error);
          errors.push(`${employee.name} - ${holiday.name}: ${result.error}`);
        }
        
        // Small delay to avoid overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${holiday.name}:`, error);
        errors.push(`${employee.name} - ${holiday.name}: ${error.message}`);
      }
    }
    
    console.log(`  Summary: Created ${employeeCreated}, Skipped ${employeeSkipped}`);
  }
  
  console.log(`\n=== SUMMARY FOR ${year} ===`);
  console.log(`Total created: ${totalCreated}`);
  console.log(`Total skipped: ${totalSkipped}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`, errors);
  }
  
  return {
    success: true,
    year,
    created: totalCreated,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * Check if a year has been populated with SH absences for all employees
 * Returns true ONLY if all 10 holidays exist for all employees
 */
async function isYearPopulated(year, employees) {
  try {
    if (!employees || employees.length === 0) {
      return false;
    }
    
    // Get all SH absences for this year
    const q = query(
      collection(db, 'absences'),
      where('absenceReason', '==', 'Søgnehelligdag')
    );
    
    const querySnapshot = await getDocs(q);
    const absencesThisYear = [];
    
    // Filter absences for this year
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.date) {
        const [day, month, absenceYear] = data.date.split('/');
        if (parseInt(absenceYear) === year) {
          absencesThisYear.push(data);
        }
      }
    });
    
    // Get expected number of absences: employees × 10 holidays
    const expectedCount = employees.length * 10;
    
    console.log(`  Found ${absencesThisYear.length} SH absences for ${year}, expected ${expectedCount}`);
    
    // Consider populated only if we have at least the expected number
    // Allow for a small margin (90%) in case some were manually deleted
    const isPopulated = absencesThisYear.length >= (expectedCount * 0.9);
    
    return isPopulated;
  } catch (error) {
    console.error('Error checking if year is populated:', error);
    return false;
  }
}

/**
 * Main function to auto-populate SH for current and next year
 * This should be called when the app loads or when Timeregistrering module loads
 */
export async function autoPopulateSH(employees) {
  console.log('\n🔄 AUTO-POPULATE SH: Starting check...');
  
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  const results = {
    currentYear: null,
    nextYear: null,
    success: true
  };
  
  try {
    // Check current year
    const currentYearPopulated = await isYearPopulated(currentYear, employees);
    console.log(`Current year (${currentYear}) populated: ${currentYearPopulated}`);
    
    if (!currentYearPopulated) {
      console.log(`⚠️ Current year (${currentYear}) NOT populated - creating SH absences...`);
      results.currentYear = await populateSHForYear(currentYear, employees);
    } else {
      console.log(`✅ Current year (${currentYear}) already populated`);
      results.currentYear = { success: true, created: 0, skipped: 0, message: 'Already populated' };
    }
    
    // Check next year
    const nextYearPopulated = await isYearPopulated(nextYear, employees);
    console.log(`Next year (${nextYear}) populated: ${nextYearPopulated}`);
    
    if (!nextYearPopulated) {
      console.log(`⚠️ Next year (${nextYear}) NOT populated - creating SH absences...`);
      results.nextYear = await populateSHForYear(nextYear, employees);
    } else {
      console.log(`✅ Next year (${nextYear}) already populated`);
      results.nextYear = { success: true, created: 0, skipped: 0, message: 'Already populated' };
    }
    
    console.log('\n✅ AUTO-POPULATE SH: Complete');
    console.log('Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ AUTO-POPULATE SH: Error:', error);
    results.success = false;
    results.error = error.message;
    return results;
  }
}

/**
 * Force populate specific years (for initial setup or manual override)
 * Use this function to manually populate 2025 and 2026 immediately
 */
export async function forcePopulateYears(years, employees) {
  console.log('\n🔧 FORCE POPULATE: Starting...');
  console.log('Years to populate:', years);
  
  const results = {};
  
  for (const year of years) {
    console.log(`\n--- Processing year ${year} ---`);
    results[year] = await populateSHForYear(year, employees);
  }
  
  console.log('\n✅ FORCE POPULATE: Complete');
  return results;
}