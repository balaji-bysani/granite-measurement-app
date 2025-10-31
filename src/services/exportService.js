import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CUSTOMER_TYPE_LABELS } from '../utils/constants';

/**
 * Export service for generating PDF and CSV files from measurement sheet data
 */
export const exportService = {
  /**
   * Generate PDF from measurement sheet data
   * @param {Object} measurementSheet - Measurement sheet data
   * @param {Object} companyDetails - Company information for header
   * @returns {Promise<Blob>} - PDF blob
   */
  async generatePDF(measurementSheet, companyDetails = {
    name: 'Granite Manufacturing Co.',
    address: '123 Industrial Ave, Manufacturing District',
    phone: '(555) 123-4567',
    email: 'info@granitemanufacturing.com'
  }) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Company Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(companyDetails.name, 20, yPosition);
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(companyDetails.address, 20, yPosition);
      
      yPosition += 5;
      doc.text(`Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`, 20, yPosition);

      // Document Title and Sheet Number
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MEASUREMENT SHEET', pageWidth - 20, 20, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text(`#${measurementSheet.measurementSheetNumber}`, pageWidth - 20, 30, { align: 'right' });

      yPosition += 15;

      // Horizontal line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10;

      // Customer Information
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const customerInfo = [
        [`Name: ${measurementSheet.customer?.name || 'N/A'}`, `Phone: ${measurementSheet.customer?.phoneNumber || 'N/A'}`],
        [`Email: ${measurementSheet.customer?.email || 'N/A'}`, `Type: ${CUSTOMER_TYPE_LABELS[measurementSheet.customerType] || measurementSheet.customerType}`],
        [`Address: ${measurementSheet.customer?.address || 'N/A'}`, `Date: ${new Date(measurementSheet.createdAt).toLocaleDateString()}`]
      ];

      customerInfo.forEach(([left, right]) => {
        doc.text(left, 20, yPosition);
        doc.text(right, pageWidth / 2 + 10, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Slab Entries Table
      if (measurementSheet.slabEntries && measurementSheet.slabEntries.length > 0) {
        checkPageBreak(60);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Slab Entries', 20, yPosition);
        yPosition += 10;

        const tableData = measurementSheet.slabEntries.map(entry => [
          entry.serialNumber.toString(),
          entry.blockNumber,
          entry.length.toString(),
          entry.breadth.toString(),
          entry.slabCategory,
          entry.finalLength.toString(),
          entry.finalBreadth.toString(),
          entry.squareFeet.toFixed(2)
        ]);

        const totalSquareFeet = measurementSheet.slabEntries.reduce((sum, entry) => sum + entry.squareFeet, 0);

        doc.autoTable({
          startY: yPosition,
          head: [['S.No', 'Block No', 'Length', 'Breadth', 'Category', 'Final L', 'Final B', 'Sq Ft']],
          body: tableData,
          foot: [['', '', '', '', '', '', 'Total:', totalSquareFeet.toFixed(2)]],
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          footStyles: {
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'center', cellWidth: 20 },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center', cellWidth: 18 },
            5: { halign: 'center', cellWidth: 18 },
            6: { halign: 'center', cellWidth: 18 },
            7: { halign: 'right', cellWidth: 20 }
          }
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Individual Calculations
        checkPageBreak(80);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Individual Slab Calculations', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        measurementSheet.slabEntries.forEach((entry, index) => {
          checkPageBreak(25);
          
          doc.setFont('helvetica', 'bold');
          doc.text(`Slab #${entry.serialNumber} (${entry.slabCategory})`, 20, yPosition);
          yPosition += 5;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Block: ${entry.blockNumber}`, 25, yPosition);
          yPosition += 4;
          doc.text(`Original: ${entry.length}" × ${entry.breadth}"`, 25, yPosition);
          yPosition += 4;
          doc.text(`Final: ${entry.finalLength}" × ${entry.finalBreadth}"`, 25, yPosition);
          yPosition += 4;
          doc.text(`Calculation: ${entry.calculationDetails}`, 25, yPosition);
          yPosition += 4;
          doc.setFont('helvetica', 'bold');
          doc.text(`Result: ${entry.squareFeet.toFixed(2)} sq ft`, 25, yPosition);
          yPosition += 8;
          doc.setFont('helvetica', 'normal');
        });
      }

      // Summary Section
      checkPageBreak(30);
      yPosition += 5;
      
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const totalSlabs = measurementSheet.slabEntries?.length || 0;
      const totalSquareFeet = measurementSheet.slabEntries?.reduce((sum, entry) => sum + entry.squareFeet, 0) || 0;
      
      doc.text(`Total Slabs: ${totalSlabs}`, 20, yPosition);
      doc.text(`Customer Type: ${CUSTOMER_TYPE_LABELS[measurementSheet.customerType]}`, pageWidth / 2, yPosition);
      yPosition += 8;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Square Feet: ${totalSquareFeet.toFixed(2)} sq ft`, 20, yPosition);

      // Footer
      yPosition = pageHeight - 40;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Signature: ________________________', 20, yPosition);
      doc.text('Authorized Signature: ________________________', pageWidth / 2 + 10, yPosition);
      
      yPosition += 10;
      doc.setFontSize(8);
      doc.text('This measurement sheet is computer generated and does not require a signature for validity.', 20, yPosition);
      yPosition += 4;
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, yPosition);

      return doc.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  },

  /**
   * Generate CSV from measurement sheet data
   * @param {Object} measurementSheet - Measurement sheet data
   * @returns {Promise<string>} - CSV data as string
   */
  async generateCSV(measurementSheet) {
    try {
      const headers = [
        'Measurement Sheet Number',
        'Customer Name',
        'Customer Phone',
        'Customer Email',
        'Customer Address',
        'Customer Type',
        'Date Created',
        'Serial Number',
        'Block Number',
        'Original Length (in)',
        'Original Breadth (in)',
        'Slab Category',
        'Final Length (in)',
        'Final Breadth (in)',
        'Square Feet',
        'Calculation Details'
      ];

      let csvContent = headers.join(',') + '\n';

      if (measurementSheet.slabEntries && measurementSheet.slabEntries.length > 0) {
        measurementSheet.slabEntries.forEach(entry => {
          const row = [
            `"${measurementSheet.measurementSheetNumber || ''}"`,
            `"${measurementSheet.customer?.name || ''}"`,
            `"${measurementSheet.customer?.phoneNumber || ''}"`,
            `"${measurementSheet.customer?.email || ''}"`,
            `"${measurementSheet.customer?.address || ''}"`,
            `"${CUSTOMER_TYPE_LABELS[measurementSheet.customerType] || measurementSheet.customerType}"`,
            `"${new Date(measurementSheet.createdAt).toLocaleDateString()}"`,
            entry.serialNumber,
            `"${entry.blockNumber}"`,
            entry.length,
            entry.breadth,
            `"${entry.slabCategory}"`,
            entry.finalLength,
            entry.finalBreadth,
            entry.squareFeet.toFixed(2),
            `"${entry.calculationDetails || ''}"`
          ];
          csvContent += row.join(',') + '\n';
        });
      } else {
        // If no slab entries, still include the measurement sheet info
        const row = [
          `"${measurementSheet.measurementSheetNumber || ''}"`,
          `"${measurementSheet.customer?.name || ''}"`,
          `"${measurementSheet.customer?.phoneNumber || ''}"`,
          `"${measurementSheet.customer?.email || ''}"`,
          `"${measurementSheet.customer?.address || ''}"`,
          `"${CUSTOMER_TYPE_LABELS[measurementSheet.customerType] || measurementSheet.customerType}"`,
          `"${new Date(measurementSheet.createdAt).toLocaleDateString()}"`,
          '', '', '', '', '', '', '', '0.00', ''
        ];
        csvContent += row.join(',') + '\n';
      }

      // Add summary row
      const totalSquareFeet = measurementSheet.slabEntries?.reduce((sum, entry) => sum + entry.squareFeet, 0) || 0;
      csvContent += '\n';
      csvContent += `"SUMMARY",,,,,,,"Total Slabs: ${measurementSheet.slabEntries?.length || 0}",,,,,,"Total Square Feet: ${totalSquareFeet.toFixed(2)}",,\n`;

      return csvContent;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw new Error('Failed to generate CSV. Please try again.');
    }
  },

  /**
   * Download file with given content and filename
   * @param {Blob|string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type for the file
   */
  downloadFile(content, filename, mimeType = 'application/octet-stream') {
    try {
      let blob;
      if (content instanceof Blob) {
        blob = content;
      } else {
        blob = new Blob([content], { type: mimeType });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file. Please try again.');
    }
  }
};