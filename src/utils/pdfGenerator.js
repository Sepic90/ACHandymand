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
  
  yPosition += 10;
  
  // Month pair subtitle
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const monthPairLabel = getMonthPairLabel(startMonthIndex);
  pdf.text(monthPairLabel, margin, yPosition);
  
  yPosition += 10;
  
  // Company information
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AC Handymand.dk ApS', margin, yPosition);
  yPosition += 5;
  pdf.text('Axel Juels Allé 72', margin, yPosition);
  yPosition += 5;
  pdf.text('2750 Ballerup', margin, yPosition);
  yPosition += 5;
  pdf.text('CVR 42397792', margin, yPosition);
  
  yPosition += 8;
  
  // Statement - normal
  pdf.setFont('helvetica', 'normal');
  pdf.text('Oversigt over arbejdstimer, SH og overarbejde (OA).', margin, yPosition);
  yPosition += 5;
  
  // Statement - bold red
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 0, 0);
  pdf.text('Afleveres d. 19 i hver måned.', margin, yPosition);
  pdf.setTextColor(0, 0, 0);
  
  yPosition += 10;
  
  // Table
  drawTable(pdf, margin, yPosition, pageWidth - 2 * margin, dates);
  
  // Signature line at bottom - centered with label
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
  pdf.text(employeeName, nameX, signatureY + 5);
}

/**
 * Draw the timesheet table
 */
function drawTable(pdf, x, y, width, dates) {
  const startY = y;
  
  // Column definitions with exact headers
  const columns = [
    { header: 'Dato', width: 15 },
    { header: 'Ugedag', width: 18 },
    { header: 'Fra kl. / Til kl.', width: 30 },
    { header: 'Total timer', width: 20 },
    { header: 'Total timer\nminus frokost', width: 25 },
    { header: 'Kundens navn / Nume client\nBy / Oraș', width: 45 },
    { header: 'Arb. timer', width: 20 },
    { header: 'OA', width: 12 }
  ];
  
  // Calculate actual column widths to fit table width
  const totalDefinedWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scaleFactor = width / totalDefinedWidth;
  columns.forEach(col => col.width *= scaleFactor);
  
  const rowHeight = 6;
  const headerHeight = 12;
  
  // Draw header
  let currentX = x;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  columns.forEach(col => {
    // Draw header cell border
    pdf.rect(currentX, y, col.width, headerHeight);
    
    // Draw header text (handle multi-line)
    const lines = col.header.split('\n');
    const lineHeight = 3.5;
    const startLineY = y + (headerHeight - (lines.length * lineHeight)) / 2 + lineHeight;
    
    lines.forEach((line, lineIndex) => {
      const textWidth = pdf.getTextWidth(line);
      const textX = currentX + (col.width - textWidth) / 2;
      pdf.text(line, textX, startLineY + (lineIndex * lineHeight));
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
        const textWidth = pdf.getTextWidth(cellText);
        const textX = currentX + (col.width - textWidth) / 2;
        pdf.text(cellText, textX, y + rowHeight / 2 + 1.5);
        pdf.setTextColor(0, 0, 0);
      }
      
      currentX += col.width;
    });
    
    y += rowHeight;
  });
}