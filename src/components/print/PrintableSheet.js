import React from 'react';
import { CUSTOMER_TYPE_LABELS } from '../../utils/constants';
import './PrintableSheet.css';

const PrintableSheet = ({ 
  measurementSheet, 
  companyDetails = {
    name: 'Granite Manufacturing Co.',
    address: '123 Industrial Ave, Manufacturing District',
    phone: '(555) 123-4567',
    email: 'info@granitemanufacturing.com'
  },
  includeSections = {
    header: true,
    customerDetails: true,
    slabEntries: true,
    calculations: true,
    totals: true,
    footer: true
  }
}) => {
  if (!measurementSheet) {
    return <div>No measurement sheet data available</div>;
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalSquareFeet = measurementSheet.slabEntries?.reduce((sum, entry) => sum + (entry.squareFeet || 0), 0) || 0;

  return (
    <div className="printable-sheet">
      {/* Company Header */}
      {includeSections.header && (
        <div className="print-header">
          <div className="company-info">
            <h1 className="company-name">{companyDetails.name}</h1>
            <div className="company-details">
              <div>{companyDetails.address}</div>
              <div>Phone: {companyDetails.phone} | Email: {companyDetails.email}</div>
            </div>
          </div>
          <div className="document-title">
            <h2>MEASUREMENT SHEET</h2>
            <div className="sheet-number">#{measurementSheet.measurementSheetNumber}</div>
          </div>
        </div>
      )}

      {/* Customer Information */}
      {includeSections.customerDetails && measurementSheet.customer && (
        <div className="customer-section">
          <h3>Customer Information</h3>
          <div className="customer-grid">
            <div className="customer-field">
              <label>Name:</label>
              <span>{measurementSheet.customer.name}</span>
            </div>
            <div className="customer-field">
              <label>Phone:</label>
              <span>{measurementSheet.customer.phoneNumber || 'N/A'}</span>
            </div>
            <div className="customer-field">
              <label>Email:</label>
              <span>{measurementSheet.customer.email || 'N/A'}</span>
            </div>
            <div className="customer-field">
              <label>Customer Type:</label>
              <span>{CUSTOMER_TYPE_LABELS[measurementSheet.customerType] || measurementSheet.customerType}</span>
            </div>
            <div className="customer-field full-width">
              <label>Address:</label>
              <span>{measurementSheet.customer.address || 'N/A'}</span>
            </div>
            <div className="customer-field">
              <label>Date:</label>
              <span>{formatDate(measurementSheet.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Slab Entries Table */}
      {includeSections.slabEntries && measurementSheet.slabEntries?.length > 0 && (
        <div className="slab-entries-section">
          <h3>Slab Entries</h3>
          <table className="slab-entries-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Block No</th>
                <th>Length (in)</th>
                <th>Breadth (in)</th>
                <th>Category</th>
                <th>Final Length (in)</th>
                <th>Final Breadth (in)</th>
                <th>Square Feet</th>
              </tr>
            </thead>
            <tbody>
              {measurementSheet.slabEntries.map((entry, index) => (
                <tr key={entry.id || index}>
                  <td>{entry.serialNumber}</td>
                  <td>{entry.blockNumber}</td>
                  <td>{entry.length}</td>
                  <td>{entry.breadth}</td>
                  <td>{entry.slabCategory}</td>
                  <td>{entry.finalLength}</td>
                  <td>{entry.finalBreadth}</td>
                  <td>{entry.squareFeet.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="7"><strong>Total Square Feet:</strong></td>
                <td><strong>{totalSquareFeet.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Individual Calculations */}
      {includeSections.calculations && measurementSheet.slabEntries?.length > 0 && (
        <div className="calculations-section">
          <h3>Individual Slab Calculations</h3>
          <div className="calculations-grid">
            {measurementSheet.slabEntries.map((entry, index) => (
              <div key={entry.id || index} className="calculation-item">
                <div className="calculation-header">
                  <strong>Slab #{entry.serialNumber}</strong>
                  <span className="category-badge">{entry.slabCategory}</span>
                </div>
                <div className="calculation-details">
                  <div>Block: {entry.blockNumber}</div>
                  <div>Original: {entry.length}" × {entry.breadth}"</div>
                  <div>Final: {entry.finalLength}" × {entry.finalBreadth}"</div>
                  <div className="calculation-formula">{entry.calculationDetails}</div>
                  <div className="calculation-result">Result: {entry.squareFeet.toFixed(2)} sq ft</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Totals */}
      {includeSections.totals && (
        <div className="totals-section">
          <div className="totals-grid">
            <div className="total-item">
              <label>Total Slabs:</label>
              <span>{measurementSheet.slabEntries?.length || 0}</span>
            </div>
            <div className="total-item">
              <label>Customer Type:</label>
              <span>{CUSTOMER_TYPE_LABELS[measurementSheet.customerType] || measurementSheet.customerType}</span>
            </div>
            <div className="total-item highlight">
              <label>Total Square Feet:</label>
              <span>{totalSquareFeet.toFixed(2)} sq ft</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {includeSections.footer && (
        <div className="print-footer">
          <div className="footer-content">
            <div className="signature-section">
              <div className="signature-line">
                <div className="signature-label">Customer Signature</div>
                <div className="signature-box"></div>
              </div>
              <div className="signature-line">
                <div className="signature-label">Authorized Signature</div>
                <div className="signature-box"></div>
              </div>
            </div>
            <div className="footer-note">
              <p>This measurement sheet is computer generated and does not require a signature for validity.</p>
              <p>Generated on: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintableSheet;