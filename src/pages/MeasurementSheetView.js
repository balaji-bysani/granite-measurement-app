import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { MeasurementSheetHeader, SlabEntriesTable, SlabEntryEditModal } from '../components/measurement-sheet';
import { SlabEntryForm } from '../components/measurement-sheet';
import { PrintPreviewModal } from '../components/print';
import CustomModal from '../components/common/CustomModal';
import CustomButton from '../components/common/CustomButton';
import { measurementSheetService } from '../services/measurementSheetService';
import { exportService } from '../services/exportService';
import { calculationEngine } from '../utils/calculationEngine';
import { MEASUREMENT_SHEET_STATUS } from '../utils/constants';

const MeasurementSheetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [measurementSheet, setMeasurementSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteEntryConfirm, setShowDeleteEntryConfirm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntryIndex, setDeletingEntryIndex] = useState(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');

  // Load measurement sheet data
  useEffect(() => {
    loadMeasurementSheet();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMeasurementSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await measurementSheetService.getMeasurementSheet(id);
      
      // Ensure slabEntries is an array and recalculate totals
      if (data.slabEntries && Array.isArray(data.slabEntries)) {
        data.slabEntries = data.slabEntries.map((entry, index) => ({
          ...entry,
          serialNumber: entry.serialNumber || index + 1
        }));
      } else {
        data.slabEntries = [];
      }
      
      setMeasurementSheet(data);
    } catch (err) {
      console.error('Error loading measurement sheet:', err);
      setError('Failed to load measurement sheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSquareFeet = (entries) => {
    return entries.reduce((sum, entry) => sum + (entry.squareFeet || 0), 0);
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode - show confirmation if there are unsaved changes
      setIsEditMode(false);
      setSuccessMessage('');
    } else {
      // Entering edit mode
      setIsEditMode(true);
      setSuccessMessage('');
    }
  };

  const handleAddSlabEntry = async (slabData) => {
    try {
      setSaving(true);
      
      // Calculate square footage using the calculation engine
      const calculation = calculationEngine.calculateSquareFeet(
        slabData.length,
        slabData.breadth,
        measurementSheet.customerType
      );
      
      const newEntry = {
        ...slabData,
        serialNumber: measurementSheet.slabEntries.length + 1,
        finalLength: calculation.finalLength,
        finalBreadth: calculation.finalBreadth,
        squareFeet: calculation.squareFeet,
        calculationDetails: calculation.rawCalculation,
        id: `temp_${Date.now()}_${Math.random()}`
      };
      
      // Add to backend
      const savedEntry = await measurementSheetService.addSlabEntry(id, newEntry);
      
      // Update local state
      const updatedEntries = [...measurementSheet.slabEntries, savedEntry];
      const updatedSheet = {
        ...measurementSheet,
        slabEntries: updatedEntries,
        totalSquareFeet: calculateTotalSquareFeet(updatedEntries)
      };
      
      setMeasurementSheet(updatedSheet);
      setSuccessMessage('Slab entry added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error adding slab entry:', err);
      setError('Failed to add slab entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEntry = (entry, index) => {
    setEditingEntry({ ...entry, index });
    setShowEditModal(true);
  };

  const handleSaveEditedEntry = async (updatedEntry) => {
    try {
      setSaving(true);
      
      // Update in backend
      await measurementSheetService.updateSlabEntry(updatedEntry.id, updatedEntry);
      
      // Update local state
      const updatedEntries = [...measurementSheet.slabEntries];
      updatedEntries[editingEntry.index] = updatedEntry;
      
      const updatedSheet = {
        ...measurementSheet,
        slabEntries: updatedEntries,
        totalSquareFeet: calculateTotalSquareFeet(updatedEntries)
      };
      
      setMeasurementSheet(updatedSheet);
      setSuccessMessage('Slab entry updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error updating slab entry:', err);
      setError('Failed to update slab entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = (index) => {
    setDeletingEntryIndex(index);
    setShowDeleteEntryConfirm(true);
  };

  const confirmDeleteEntry = async () => {
    try {
      setSaving(true);
      const entryToDelete = measurementSheet.slabEntries[deletingEntryIndex];
      
      // Delete from backend
      await measurementSheetService.deleteSlabEntry(entryToDelete.id);
      
      // Update local state
      const updatedEntries = measurementSheet.slabEntries.filter((_, index) => index !== deletingEntryIndex);
      
      // Renumber serial numbers
      const renumberedEntries = updatedEntries.map((entry, index) => ({
        ...entry,
        serialNumber: index + 1
      }));
      
      const updatedSheet = {
        ...measurementSheet,
        slabEntries: renumberedEntries,
        totalSquareFeet: calculateTotalSquareFeet(renumberedEntries)
      };
      
      setMeasurementSheet(updatedSheet);
      setSuccessMessage('Slab entry deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error deleting slab entry:', err);
      setError('Failed to delete slab entry. Please try again.');
    } finally {
      setSaving(false);
      setShowDeleteEntryConfirm(false);
      setDeletingEntryIndex(null);
    }
  };

  const handleSaveMeasurementSheet = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        status: MEASUREMENT_SHEET_STATUS.COMPLETED,
        totalSquareFeet: calculateTotalSquareFeet(measurementSheet.slabEntries)
      };
      
      await measurementSheetService.updateMeasurementSheet(id, updateData);
      
      const updatedSheet = {
        ...measurementSheet,
        ...updateData
      };
      
      setMeasurementSheet(updatedSheet);
      setIsEditMode(false);
      setSuccessMessage('Measurement sheet saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error saving measurement sheet:', err);
      setError('Failed to save measurement sheet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeasurementSheet = async () => {
    try {
      setSaving(true);
      await measurementSheetService.deleteMeasurementSheet(id);
      navigate('/measurement-sheets');
    } catch (err) {
      console.error('Error deleting measurement sheet:', err);
      setError('Failed to delete measurement sheet. Please try again.');
      setSaving(false);
    }
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handleExportPDF = async () => {
    try {
      setSaving(true);
      const blob = await exportService.generatePDF(measurementSheet);
      exportService.downloadFile(
        blob, 
        `measurement-sheet-${measurementSheet.measurementSheetNumber}.pdf`,
        'application/pdf'
      );
      setSuccessMessage('PDF exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setSaving(true);
      const csvData = await exportService.generateCSV(measurementSheet);
      exportService.downloadFile(
        csvData,
        `measurement-sheet-${measurementSheet.measurementSheetNumber}.csv`,
        'text/csv'
      );
      setSuccessMessage('CSV exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading measurement sheet...</div>
        </div>
      </Container>
    );
  }

  if (error && !measurementSheet) {
    return (
      <Container>
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error Loading Measurement Sheet</Alert.Heading>
              <p>{error}</p>
              <div className="d-flex gap-2">
                <Button variant="outline-danger" onClick={loadMeasurementSheet}>
                  Try Again
                </Button>
                <Button variant="secondary" onClick={() => navigate('/measurement-sheets')}>
                  Back to List
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Action Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-2">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/measurement-sheets')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to List
                </Button>
                
                <Badge 
                  bg={measurementSheet?.status === 'completed' ? 'success' : 'warning'}
                  className="fs-6"
                >
                  {measurementSheet?.status === 'completed' ? 'Completed' : 'Draft'}
                </Badge>
              </div>
            </Col>
            
            <Col xs="auto">
              <div className="d-flex gap-2">
                {/* Edit Mode Toggle */}
                <CustomButton
                  variant={isEditMode ? 'success' : 'primary'}
                  onClick={handleToggleEditMode}
                  disabled={saving}
                >
                  <i className={`bi ${isEditMode ? 'bi-check-lg' : 'bi-pencil'} me-2`}></i>
                  {isEditMode ? 'View Mode' : 'Edit Mode'}
                </CustomButton>

                {/* Save Button (only in edit mode) */}
                {isEditMode && (
                  <CustomButton
                    variant="success"
                    onClick={handleSaveMeasurementSheet}
                    loading={saving}
                    disabled={!measurementSheet?.slabEntries?.length}
                  >
                    <i className="bi bi-save me-2"></i>
                    Save Sheet
                  </CustomButton>
                )}

                {/* Print and Export Buttons */}
                <CustomButton
                  variant="outline-primary"
                  onClick={handlePrintPreview}
                  disabled={saving || !measurementSheet?.slabEntries?.length}
                >
                  <i className="bi bi-printer me-2"></i>
                  Print
                </CustomButton>

                <CustomButton
                  variant="outline-info"
                  onClick={handleExportPDF}
                  disabled={saving || !measurementSheet?.slabEntries?.length}
                  loading={saving}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  PDF
                </CustomButton>

                <CustomButton
                  variant="outline-success"
                  onClick={handleExportCSV}
                  disabled={saving || !measurementSheet?.slabEntries?.length}
                  loading={saving}
                >
                  <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                  CSV
                </CustomButton>

                {/* Delete Button */}
                <CustomButton
                  variant="outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete
                </CustomButton>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Measurement Sheet Header */}
      <MeasurementSheetHeader
        measurementSheetNumber={measurementSheet?.measurementSheetNumber}
        customer={measurementSheet?.customer}
        customerType={measurementSheet?.customerType}
        createdAt={measurementSheet?.createdAt}
        totalSquareFeet={calculateTotalSquareFeet(measurementSheet?.slabEntries || [])}
        slabCount={measurementSheet?.slabEntries?.length || 0}
      />

      {/* Add New Slab Entry Form (only in edit mode) */}
      {isEditMode && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Slab Entry
            </h5>
          </Card.Header>
          <Card.Body>
            <SlabEntryForm
              onAddEntry={handleAddSlabEntry}
              customerType={measurementSheet?.customerType}
              nextSerialNumber={measurementSheet?.slabEntries?.length + 1}
              disabled={saving}
            />
          </Card.Body>
        </Card>
      )}

      {/* Slab Entries Table */}
      <SlabEntriesTable
        slabEntries={measurementSheet?.slabEntries || []}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
        customerType={measurementSheet?.customerType}
        disabled={!isEditMode || saving}
      />

      {/* Individual Slab Calculations Display */}
      {measurementSheet?.slabEntries?.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-calculator me-2"></i>
              Individual Slab Calculations
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {measurementSheet.slabEntries.map((entry, index) => (
                <Col md={6} lg={4} key={entry.id || index} className="mb-3">
                  <Card className="h-100 border-light">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">Slab #{entry.serialNumber}</h6>
                        <Badge bg="secondary">{entry.slabCategory}</Badge>
                      </div>
                      
                      <div className="small text-muted mb-2">
                        Block: {entry.blockNumber}
                      </div>
                      
                      <div className="mb-2">
                        <div className="small text-muted">Original Dimensions:</div>
                        <div>{entry.length}" × {entry.breadth}"</div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="small text-muted">Final Dimensions:</div>
                        <div>{entry.finalLength}" × {entry.finalBreadth}"</div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="small text-muted">Calculation:</div>
                        <div className="font-monospace small">
                          {entry.calculationDetails}
                        </div>
                      </div>
                      
                      <div className="text-center pt-2 border-top">
                        <div className="small text-muted">Square Feet</div>
                        <div className="fw-bold text-success fs-5">
                          {entry.squareFeet.toFixed(2)}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Edit Slab Entry Modal */}
      <SlabEntryEditModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEditedEntry}
        entry={editingEntry}
        customerType={measurementSheet?.customerType}
      />

      {/* Delete Measurement Sheet Confirmation */}
      <CustomModal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        title="Delete Measurement Sheet"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteMeasurementSheet}
        loading={saving}
      >
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Warning:</strong> This action cannot be undone.
        </Alert>
        <p>
          Are you sure you want to delete measurement sheet <strong>#{measurementSheet?.measurementSheetNumber}</strong>?
        </p>
        <p className="text-muted mb-0">
          This will permanently remove the measurement sheet and all associated slab entries.
        </p>
      </CustomModal>

      {/* Delete Slab Entry Confirmation */}
      <CustomModal
        show={showDeleteEntryConfirm}
        onHide={() => {
          setShowDeleteEntryConfirm(false);
          setDeletingEntryIndex(null);
        }}
        title="Delete Slab Entry"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteEntry}
        loading={saving}
      >
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Warning:</strong> This action cannot be undone.
        </Alert>
        <p>
          Are you sure you want to delete slab entry #{deletingEntryIndex !== null ? measurementSheet?.slabEntries[deletingEntryIndex]?.serialNumber : ''}?
        </p>
        <p className="text-muted mb-0">
          This will permanently remove the slab entry and renumber subsequent entries.
        </p>
      </CustomModal>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        show={showPrintPreview}
        onHide={() => setShowPrintPreview(false)}
        measurementSheet={measurementSheet}
        companyDetails={{
          name: 'Granite Manufacturing Co.',
          address: '123 Industrial Ave, Manufacturing District',
          phone: '(555) 123-4567',
          email: 'info@granitemanufacturing.com'
        }}
      />
    </Container>
  );
};

export default MeasurementSheetView;