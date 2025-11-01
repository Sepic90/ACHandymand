import jsPDF from 'jspdf';
import { generateDateRange, getMonthPairLabel, getYearLabel } from './dateUtils.js';

/**
 * Generate timesheet PDF(s)
 */
export async function generateTimesheetPDF(year, startMonthIndex, employees, allEmployees) {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  // Determine which employees to include
  const employeesToInclude = allEmployees ? employees : [employees[0]];
  
  // Generate dates for the period
  const dates = generateDateRange(year, startMonthIndex);
  
  // Try to load the logo
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
  
  // Generate a page for each employee
  employeesToInclude.forEach((employee, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage();
    }
    
    generateEmployeePage(pdf, year, startMonthIndex, dates, employee, logoData);
  });
  
  // Download the PDF
  const monthPairLabel = getMonthPairLabel(startMonthIndex);
  const yearLabel = getYearLabel(year, startMonthIndex);
  const filename = `Timeregistrering_${yearLabel.replace(' / ', '_')}_${monthPairLabel.replace(' / ', '_')}.pdf`;
  
  pdf.save(filename);
}

/**
 * Generate a single page for an employee
 */
function generateEmployeePage(pdf, year, startMonthIndex, dates, employeeName, logoData) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  
  let yPosition = margin;
  
  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const yearLabel = getYearLabel(year, startMonthIndex);
  pdf.text(`${yearLabel} Timeregistrering`, margin, yPosition);
  
  // Add company logo on the right side (if available)
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
  
  // Month pair subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const monthPairLabel = getMonthPairLabel(startMonthIndex);
  pdf.text(monthPairLabel, margin, yPosition);
  
  yPosition += 8;
  
  // Company information
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
  
  // Statement - normal
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Oversigt over arbejdstimer, SH og overarbejde (OA).', margin, yPosition);
  yPosition += 4;
  
  // Statement - bold red
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 0, 0);
  pdf.text('Afleveres d. 19 i hver måned.', margin, yPosition);
  pdf.setTextColor(0, 0, 0);
  
  yPosition += 8;
  
  // Table
  drawTable(pdf, margin, yPosition, pageWidth - 2 * margin, dates);
  
  // Signature line at bottom - centered with label - moved closer to bottom for more signing space
  const signatureY = pageHeight - 25;
  const signatureWidth = pageWidth / 3;
  const signatureX = (pageWidth - signatureWidth) / 2;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  // "Underskrift" label to the left of the line
  pdf.text('Underskrift:', signatureX - 25, signatureY);
  
  // Signature line
  pdf.line(signatureX, signatureY, signatureX + signatureWidth, signatureY);
  
  // Employee name below the line, centered
  const nameWidth = pdf.getTextWidth(employeeName);
  const nameX = signatureX + (signatureWidth - nameWidth) / 2;
  pdf.text(employeeName, nameX, signatureY + 6);
}

/**
 * Draw the timesheet table
 */
function drawTable(pdf, x, y, width, dates) {
  const startY = y;
  
  // Column definitions with exact headers
  const columns = [
    { header: 'Dato', width: 12 },
    { header: 'Ugedag', width: 14 },
    { header: 'Fra kl. / Til kl.', width: 32 },
    { header: 'Total timer', width: 22 },
    { header: 'Total timer\nminus frokost', width: 28 },
    { header: 'Kundens navn / Nume client\nBy / Oras', width: 50 },
    { header: 'Arb. timer', width: 22 },
    { header: 'OA', width: 8 }
  ];
  
  // Calculate actual column widths to fit table width
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
    // Draw header cell border
    pdf.rect(currentX, y, col.width, headerHeight);
    
    // Draw header text (handle multi-line) - left-aligned with minimal padding
    const lines = col.header.split('\n');
    const lineHeight = 3;
    const startLineY = y + 3; // Start 3mm from top (minimal padding)
    
    lines.forEach((line, lineIndex) => {
      // Left-align with small padding
      pdf.text(line, currentX + 1, startLineY + (lineIndex * lineHeight));
    });
    
    currentX += col.width;
  });
  
  y += headerHeight;
  
  // Draw data rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  
  dates.forEach((dateInfo) => {
    currentX = x;
    
    columns.forEach((col, colIndex) => {
      // Draw cell border
      pdf.rect(currentX, y, col.width, rowHeight);
      
      // Draw cell content
      let cellText = '';
      let textColor = [0, 0, 0];
      
      if (colIndex === 0) {
        // Date column
        cellText = dateInfo.formattedDate;
      } else if (colIndex === 1) {
        // Weekday column
        cellText = dateInfo.weekday;
        if (dateInfo.isWeekend) {
          textColor = [255, 0, 0]; // Red for weekends
        }
      }
      // Other columns are left empty for manual filling
      
      if (cellText) {
        pdf.setTextColor(...textColor);
        // Left-align with small padding
        pdf.text(cellText, currentX + 1, y + rowHeight / 2 + 1.5);
        pdf.setTextColor(0, 0, 0);
      }
      
      currentX += col.width;
    });
    
    y += rowHeight;
  });
}