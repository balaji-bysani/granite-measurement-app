import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import PrintableSheet from './PrintableSheet';

const PrintPreviewModal = ({ 
  show, 
  onHide, 
  measurementSheet,
  companyDetails 
}) => {
  const [printOptions, setPrintOptions] = useState({
    header: true,
    customerDetails: true,
    slabEntries: true,
    calculations: true,
    totals: true,
    footer: true
  });

  const printRef = React.useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Measurement-Sheet-${measurementSheet?.measurementSheetNumber || 'Unknown'}`,
    onBeforeGetContent: () => {
      // Optional: Add any pre-print logic here
      return Promise.resolve();
    },
    onAfterPrint: () => {
      // Optional: Add any post-print logic here
      console.log('Print completed');
    },
    removeAfterPrint: true,
  });

  const handleOptionChange = (option) => {
    setPrintOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handlePrintClick = () => {
    if (!measurementSheet) {
      console.error('No measurement sheet data available for printing');
      return;
    }
    handlePrint();
  };

  if (!measurementSheet) {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Print Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No measurement sheet data available for printing.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-printer me-2"></i>
          Print Preview - Sheet #{measurementSheet.measurementSheetNumber}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Row>
          {/* Print Options Panel */}
          <Col md={3} className="border-end">
            <h6 className="mb-3">Print Options</h6>
            <Form>
              <Form.Check
                type="checkbox"
                id="print-header"
                label="Company Header"
                checked={printOptions.header}
                onChange={() => handleOptionChange('header')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="print-customer"
                label="Customer Details"
                checked={printOptions.customerDetails}
                onChange={() => handleOptionChange('customerDetails')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="print-slabs"
                label="Slab Entries Table"
                checked={printOptions.slabEntries}
                onChange={() => handleOptionChange('slabEntries')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="print-calculations"
                label="Individual Calculations"
                checked={printOptions.calculations}
                onChange={() => handleOptionChange('calculations')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="print-totals"
                label="Summary Totals"
                checked={printOptions.totals}
                onChange={() => handleOptionChange('totals')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="print-footer"
                label="Footer & Signatures"
                checked={printOptions.footer}
                onChange={() => handleOptionChange('footer')}
                className="mb-2"
              />
            </Form>
            
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Preview shows how the document will appear when printed on A4 paper.
              </small>
            </div>
          </Col>
          
          {/* Print Preview */}
          <Col md={9}>
            <div className="print-preview-container" style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px',
              borderRadius: '8px'
            }}>
              <div ref={printRef}>
                <PrintableSheet
                  measurementSheet={measurementSheet}
                  companyDetails={companyDetails}
                  includeSections={printOptions}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted small">
            <i className="bi bi-file-text me-1"></i>
            {measurementSheet.slabEntries?.length || 0} slab entries • 
            Total: {(measurementSheet.slabEntries?.reduce((sum, entry) => sum + (entry.squareFeet || 0), 0) || 0).toFixed(2)} sq ft
          </div>
          <div>
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePrintClick}
              disabled={!measurementSheet.slabEntries?.length}
            >
              <i className="bi bi-printer me-2"></i>
              Print
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PrintPreviewModal;