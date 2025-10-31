import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { CustomerSelectionInterface } from '../components/customer';
import { 
  MeasurementSheetHeader, 
  SlabEntryForm, 
  SlabEntriesTable, 
  SlabEntryEditModal 
} from '../components/measurement-sheet';
import { 
  ErrorAlert, 
  LoadingSpinner, 
  ConfirmationModal 
} from '../components/common';
import { measurementSheetService } from '../services/measurementSheetService';
import useErrorHandler from '../hooks/useErrorHandler';

const MeasurementSheetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // State management
  const [currentStep, setCurrentStep] = useState(1); // 1: Customer Selection, 2: Measurement Sheet Entry
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerType, setSelectedCustomerType] = useState(null);
  const [measurementSheet, setMeasurementSheet] = useState(null);
  const [slabEntries, setSlabEntries] = useState([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  
  // Error handling
  const { 
    error, 
    isLoading, 
    clearError, 
    executeWithErrorHandling 
  } = useErrorHandler();
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // Load existing measurement sheet if editing
  useEffect(() => {
    if (isEdit && id) {
      loadMeasurementSheet(id);
    }
  }, [isEdit, id, loadMeasurementSheet]);

  const loadMeasurementSheet = async (sheetId) => {
    await executeWithErrorHandling(async () => {
      const sheet = await measurementSheetService.getMeasurementSheet(sheetId);
      setMeasurementSheet(sheet);
      setSelectedCustomer(sheet.customer);
      setSelectedCustomerType(sheet.customerType);
      setSlabEntries(sheet.slabEntries || []);
      setCurrentStep(2); // Skip customer selection for existing sheets
    }, {
      onError: (error) => {
        console.error('Failed to load measurement sheet:', error);
      }
    });
  };

  const handleCustomerSelection = ({ customerType, customer }) => {
    setSelectedCustomerType(customerType);
    setSelectedCustomer(customer);
    setCurrentStep(2);
    
    // Create new measurement sheet if not editing
    if (!isEdit) {
      createNewMeasurementSheet(customerType, customer);
    }
  };

  const createNewMeasurementSheet = async (customerType, customer) => {
    await executeWithErrorHandling(async () => {
      const newSheet = await measurementSheetService.createMeasurementSheet(customerType, customer.id);
      setMeasurementSheet(newSheet);
    }, {
      onError: (error) => {
        console.error('Failed to create measurement sheet:', error);
      }
    });
  };

  const handleAddSlabEntry = async (slabEntry) => {
    return executeWithErrorHandling(async () => {
      let updatedEntry;
      if (measurementSheet?.id) {
        // Add to existing measurement sheet via API
        updatedEntry = await measurementSheetService.addSlabEntry(measurementSheet.id, slabEntry);
      } else {
        // Add to local state for new sheets
        updatedEntry = {
          ...slabEntry,
          id: `temp_${Date.now()}_${Math.random()}`
        };
      }
      
      setSlabEntries(prev => [...prev, updatedEntry]);
      return updatedEntry;
    }, {
      loadingState: false, // Handle loading in the form component
      onError: (error) => {
        console.error('Failed to add slab entry:', error);
        throw error; // Re-throw to let form handle it
      }
    });
  };

  const handleEditEntry = (entry, index) => {
    setEditingEntry(entry);
    setEditingIndex(index);
    setShowEditModal(true);
  };

  const handleSaveEditedEntry = async (updatedEntry) => {
    await executeWithErrorHandling(async () => {
      if (measurementSheet?.id && updatedEntry.id && !updatedEntry.id.startsWith('temp_')) {
        // Update existing entry via API
        await measurementSheetService.updateSlabEntry(updatedEntry.id, updatedEntry);
      }
      
      // Update local state
      setSlabEntries(prev => {
        const newEntries = [...prev];
        newEntries[editingIndex] = updatedEntry;
        return newEntries;
      });
      
      setShowEditModal(false);
      setEditingEntry(null);
      setEditingIndex(null);
    }, {
      onError: (error) => {
        console.error('Failed to update slab entry:', error);
      }
    });
  };

  const handleDeleteEntry = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntry = async () => {
    if (deleteIndex === null) return;
    
    await executeWithErrorHandling(async () => {
      const entry = slabEntries[deleteIndex];
      
      if (measurementSheet?.id && entry.id && !entry.id.startsWith('temp_')) {
        // Delete from API
        await measurementSheetService.deleteSlabEntry(entry.id);
      }
      
      // Remove from local state
      setSlabEntries(prev => prev.filter((_, i) => i !== deleteIndex));
      setShowDeleteConfirm(false);
      setDeleteIndex(null);
    }, {
      onError: (error) => {
        console.error('Failed to delete slab entry:', error);
      }
    });
  };

  const handleSaveMeasurementSheet = async () => {
    if (slabEntries.length === 0) {
      throw new Error('Please add at least one slab entry before saving.');
    }
    
    await executeWithErrorHandling(async () => {
      if (measurementSheet?.id) {
        // Update existing measurement sheet
        await measurementSheetService.updateMeasurementSheet(measurementSheet.id, {
          status: 'completed',
          slabEntries
        });
        setShowSaveConfirm(true);
      } else {
        throw new Error('No measurement sheet found to save.');
      }
    }, {
      onError: (error) => {
        console.error('Failed to save measurement sheet:', error);
      }
    });
  };

  const handleBackToCustomerSelection = () => {
    if (slabEntries.length > 0) {
      setShowBackConfirm(true);
    } else {
      confirmBackToCustomerSelection();
    }
  };

  const confirmBackToCustomerSelection = () => {
    setCurrentStep(1);
    setSlabEntries([]);
    setMeasurementSheet(null);
    setShowBackConfirm(false);
    clearError();
  };

  const getNextSerialNumber = () => {
    return slabEntries.length + 1;
  };

  const getTotalSquareFeet = () => {
    return slabEntries.reduce((sum, entry) => sum + entry.squareFeet, 0);
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingSpinner 
          fullPage 
          text="Loading measurement sheet..." 
        />
      </Container>
    );
  }

  return (
    <Container fluid>
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      {/* Step 1: Customer Selection */}
      {currentStep === 1 && (
        <Row>
          <Col>
            <div className="mb-4">
              <h1>{isEdit ? 'Edit' : 'New'} Measurement Sheet</h1>
              <p className="text-muted">
                {isEdit ? 'Edit existing measurement sheet' : 'Create a new measurement sheet by selecting customer type and customer details'}
              </p>
            </div>
            
            <CustomerSelectionInterface
              onSelectionComplete={handleCustomerSelection}
              initialCustomerType={selectedCustomerType}
              initialCustomer={selectedCustomer}
            />
          </Col>
        </Row>
      )}

      {/* Step 2: Measurement Sheet Entry */}
      {currentStep === 2 && selectedCustomer && selectedCustomerType && (
        <Row>
          <Col>
            {/* Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1>{isEdit ? 'Edit' : 'New'} Measurement Sheet</h1>
                <p className="text-muted mb-0">
                  Add slab entries and manage measurements
                </p>
              </div>
              
              <div className="d-flex gap-2">
                {!isEdit && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleBackToCustomerSelection}
                  >
                    ← Back to Customer Selection
                  </Button>
                )}
                
                <Button 
                  variant="success" 
                  onClick={handleSaveMeasurementSheet}
                  disabled={slabEntries.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" inline className="me-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Measurement Sheet'
                  )}
                </Button>
              </div>
            </div>

            {/* Measurement Sheet Header */}
            <MeasurementSheetHeader
              measurementSheetNumber={measurementSheet?.measurementSheetNumber}
              customer={selectedCustomer}
              customerType={selectedCustomerType}
              createdAt={measurementSheet?.createdAt}
              totalSquareFeet={getTotalSquareFeet()}
              slabCount={slabEntries.length}
            />

            {/* Slab Entry Form */}
            <SlabEntryForm
              onAddEntry={handleAddSlabEntry}
              customerType={selectedCustomerType}
              nextSerialNumber={getNextSerialNumber()}
              disabled={isLoading}
            />

            {/* Slab Entries Table */}
            <SlabEntriesTable
              slabEntries={slabEntries}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              customerType={selectedCustomerType}
              disabled={isLoading}
            />
          </Col>
        </Row>
      )}

      {/* Edit Modal */}
      <SlabEntryEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSave={handleSaveEditedEntry}
        entry={editingEntry}
        customerType={selectedCustomerType}
      />

      {/* Save Confirmation Modal */}
      <Modal show={showSaveConfirm} onHide={() => setShowSaveConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Measurement Sheet Saved</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3">Successfully Saved!</h5>
            <p className="text-muted">
              Measurement sheet #{measurementSheet?.measurementSheetNumber} has been saved with {slabEntries.length} slab entries.
            </p>
            <p className="fw-bold">
              Total: {getTotalSquareFeet().toFixed(2)} square feet
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => navigate('/measurement-sheets')}>
            View All Sheets
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Back Confirmation Modal */}
      <ConfirmationModal
        show={showBackConfirm}
        onHide={() => setShowBackConfirm(false)}
        onConfirm={confirmBackToCustomerSelection}
        title="Confirm Navigation"
        message="Going back will lose all slab entries. Are you sure you want to continue?"
        confirmText="Yes, Go Back"
        cancelText="Stay Here"
        variant="warning"
        details={`You have ${slabEntries.length} slab entries that will be lost.`}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteConfirm}
        onHide={() => {
          setShowDeleteConfirm(false);
          setDeleteIndex(null);
        }}
        onConfirm={confirmDeleteEntry}
        title="Delete Slab Entry"
        message="Are you sure you want to delete this slab entry?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isLoading}
        details={deleteIndex !== null && slabEntries[deleteIndex] ? 
          `Block: ${slabEntries[deleteIndex].blockNumber}, ${slabEntries[deleteIndex].squareFeet.toFixed(2)} sq ft` : 
          null
        }
      />
    </Container>
  );
};

export default MeasurementSheetForm;