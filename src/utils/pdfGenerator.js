import jsPDF from 'jspdf';
import { generateDateRange, getMonthPairLabel, getYearLabel } from './dateUtils';
import { getAbsencesForDateRange, findAbsenceForDate, calculateWorkHours, getAbsenceComment } from './absenceUtils';

/**
 * Generate timesheet PDF for one or more employees
 */
export async function generateTimesheetPDF(year, startMonthIndex, employeeNames, allEmployees, employees) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const employeesToInclude = allEmployees 
    ? employees
    : employees.filter(emp => employeeNames.includes(emp.name));
  
  const dates = generateDateRange(year, startMonthIndex);
  
  const firstDate = dates[0].formattedDate;
  const lastDate = dates[dates.length - 1].formattedDate;
  
  console.log('=== PDF GENERATION DEBUG ===');
  console.log('Date range:', firstDate, 'to', lastDate);
  console.log('Total dates:', dates.length);
  console.log('First date format:', firstDate);
  
  let logoData = null;
  try {
    const response = await fetch('/logo_black.png');
    if (response.ok) {
      const blob = await response.blob();
      logoData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.log('Could not load logo:', error);
  }
  
  for (let pageIndex = 0; pageIndex < employeesToInclude.length; pageIndex++) {
    const employee = employeesToInclude[pageIndex];
    
    if (pageIndex > 0) {
      pdf.addPage();
    }
    
    console.log(`\n--- Loading absences for ${employee.name} (ID: ${employee.id}) ---`);
    const absencesResult = await getAbsencesForDateRange(employee.id, firstDate, lastDate);
    const absences = absencesResult.success ? absencesResult.absences : [];
    
    console.log(`Found ${absences.length} absence(s) for ${employee.name}`);
    if (absences.length > 0) {
      console.log('Absences:', absences.map(a => `${a.date} (${a.absenceReason})`).join(', '));
    }
    
    generateEmployeePage(pdf, year, startMonthIndex, dates, employee.name, logoData, absences);
  }
  
  const monthPairLabel = getMonthPairLabel(startMonthIndex);
  const yearLabel = getYearLabel(year, startMonthIndex);
  const filename = `Timeregistrering_${yearLabel.replace(' / ', '_')}_${monthPairLabel.replace(' / ', '_')}.pdf`;
  
  console.log('=== PDF GENERATION COMPLETE ===\n');
  
  pdf.save(filename);
}

/**
 * Generate a single page for an employee
 */
function generateEmployeePage(pdf, year, startMonthIndex, dates, employeeName, logoData, absences) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  
  let yPosition = margin;
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const yearLabel = getYearLabel(year, startMonthIndex);
  pdf.text(`${yearLabel} Timeregistrering`, margin, yPosition);
  
  if (logoData) {
    try {
      const logoWidth = 40;
      const logoHeight = 20;
      pdf.addImage(logoData, 'PNG', pageWidth - margin - logoWidth, yPosition - 5, logoWidth, logoHeight);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }
  
  yPosition += 8;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const monthPairLabel = getMonthPairLabel(startMonthIndex);
  pdf.text(monthPairLabel, margin, yPosition);
  
  yPosition += 8;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AC Handymand.dk ApS', margin, yPosition);
  yPosition += 4;
  pdf.text('Axel Juels Allé 72', margin, yPosition);
  yPosition += 4;
  pdf.text('2750 Ballerup', margin, yPosition);
  yPosition += 4;
  pdf.text('CVR 42397792', margin, yPosition);
  
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Oversigt over arbejdstimer, sygdom, barnets første sygedag, SH, FE, FF og overarbejde (OA).', margin, yPosition);
  yPosition += 4;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 0, 0);
  pdf.text('Afleveres d. 19 i hver måned.', margin, yPosition);
  pdf.setTextColor(0, 0, 0);
  
  yPosition += 8;
  
  drawTable(pdf, margin, yPosition, pageWidth - 2 * margin, dates, absences);
  
  const signatureY = pageHeight - 25;
  const signatureWidth = pageWidth / 3;
  const signatureX = (pageWidth - signatureWidth) / 2;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  pdf.text('Underskrift:', signatureX - 25, signatureY);
  
  pdf.line(signatureX, signatureY, signatureX + signatureWidth, signatureY);
  
  const nameWidth = pdf.getTextWidth(employeeName);
  const nameX = signatureX + (signatureWidth - nameWidth) / 2;
  pdf.text(employeeName, nameX, signatureY + 6);
}

/**
 * Draw the timesheet table
 */
function drawTable(pdf, x, y, width, dates, absences) {
  const startY = y;
  
  const columns = [
    { header: 'Dato', width: 16 },
    { header: 'Ugedag', width: 14 },
    { header: 'Fra kl. / Til kl.', width: 22 },
    { header: 'Total timer', width: 18 },
    { header: 'Total timer\nminus frokost', width: 22 },
    { header: 'Afvigelse / Bemærkning', width: 65 },
    { header: 'Arb. timer', width: 16 },
    { header: 'OA', width: 12 }
  ];
  
  const totalDefinedWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scaleFactor = width / totalDefinedWidth;
  columns.forEach(col => col.width *= scaleFactor);
  
  const rowHeight = 6;
  const headerHeight = 8;
  
  // Draw header
  let currentX = x;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  columns.forEach(col => {
    pdf.rect(currentX, y, col.width, headerHeight);
    
    const lines = col.header.split('\n');
    const lineHeight = 3;
    const startLineY = y + 3;
    
    lines.forEach((line, lineIndex) => {
      const centerX = currentX + col.width / 2;
      pdf.text(line, centerX, startLineY + (lineIndex * lineHeight), { align: 'center' });
    });
    
    currentX += col.width;
  });
  
  y += headerHeight;
  
  let totalWorkHours = 0;
  let absenceMatchCount = 0;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  
  dates.forEach((dateInfo) => {
    currentX = x;
    
    const absence = findAbsenceForDate(absences, dateInfo.formattedDate);
    const workHours = calculateWorkHours(dateInfo.formattedDate, dateInfo.weekday, absences);
    const absenceComment = getAbsenceComment(dateInfo.formattedDate, absences);
    
    if (absence) {
      absenceMatchCount++;
      console.log(`✓ Absence matched on ${dateInfo.formattedDate}: ${absence.absenceReason}`);
    }
    
    if (!dateInfo.isWeekend) {
      totalWorkHours += workHours.minusLunch;
    }
    
    columns.forEach((col, colIndex) => {
      pdf.rect(currentX, y, col.width, rowHeight);
      
      let cellText = '';
      let textColor = [0, 0, 0];
      
      if (colIndex === 0) {
        cellText = dateInfo.formattedDate;
      } else if (colIndex === 1) {
        cellText = dateInfo.weekday;
        if (dateInfo.isWeekend) {
          textColor = [255, 0, 0];
        }
      } else if (colIndex === 2 && !dateInfo.isWeekend) {
        if (!absence || absence.type === 'partial') {
          if (dateInfo.weekday === 'Fredag') {
            cellText = '07:00-14:30';
          } else {
            cellText = '07:00-15:00';
          }
        }
      } else if (colIndex === 3 && !dateInfo.isWeekend) {
        if (absence && absence.type !== 'partial') {
          cellText = '0';
        } else if (absence && absence.type === 'partial') {
          const hoursWorked = absence.hoursWorked || 0;
          cellText = hoursWorked.toString().replace('.', ',');
        } else {
          if (dateInfo.weekday === 'Fredag') {
            cellText = '7,5';
          } else {
            cellText = '8';
          }
        }
      } else if (colIndex === 4 && !dateInfo.isWeekend) {
        const hours = workHours.minusLunch;
        if (hours > 0) {
          cellText = hours.toString().replace('.', ',');
        } else {
          cellText = '0';
        }
      } else if (colIndex === 5) {
        cellText = absenceComment;
      } else if (colIndex === 6 && !dateInfo.isWeekend) {
        const hours = workHours.worked;
        if (hours > 0) {
          cellText = hours.toString().replace('.', ',');
        } else {
          cellText = '0';
        }
      }
      
      if (cellText) {
        pdf.setTextColor(...textColor);
        const centerX = currentX + col.width / 2;
        
        if (colIndex === 5 && cellText.length > 40) {
          pdf.setFontSize(7);
          const textLines = pdf.splitTextToSize(cellText, col.width - 2);
          const firstLine = textLines[0];
          pdf.text(firstLine, centerX, y + rowHeight / 2 + 1.5, { align: 'center' });
          pdf.setFontSize(8);
        } else {
          pdf.text(cellText, centerX, y + rowHeight / 2 + 1.5, { align: 'center' });
        }
        
        pdf.setTextColor(0, 0, 0);
      }
      
      currentX += col.width;
    });
    
    y += rowHeight;
  });
  
  console.log(`Total absence matches in PDF table: ${absenceMatchCount}`);
  
  // Fixed total row
  currentX = x;
  
  columns.forEach((col, colIndex) => {
    if (colIndex === 5 || colIndex === 6) {
      pdf.rect(currentX, y, col.width, rowHeight);
    }
    
    if (colIndex === 5) {
      pdf.setFont('helvetica', 'bold');
      const totalText = 'Total timer:';
      const textWidth = pdf.getTextWidth(totalText);
      pdf.text(totalText, currentX + col.width - textWidth - 1, y + rowHeight / 2 + 1.5);
      pdf.setFont('helvetica', 'normal');
    } else if (colIndex === 6) {
      pdf.setFont('helvetica', 'bold');
      const totalText = totalWorkHours.toString().replace('.', ',');
      const centerX = currentX + col.width / 2;
      pdf.text(totalText, centerX, y + rowHeight / 2 + 1.5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
    }
    
    currentX += col.width;
  });
}