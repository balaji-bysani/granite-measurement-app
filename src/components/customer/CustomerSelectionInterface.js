import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import CustomerTypeSelection from './CustomerTypeSelection';
import CustomerSearch from './CustomerSearch';
import CustomerRegistrationForm from './CustomerRegistrationForm';
import CustomerDetails from './CustomerDetails';

const CustomerSelectionInterface = ({ 
  onSelectionComplete, 
  initialCustomerType = null,
  initialCustomer = null,
  disabled = false 
}) => {
  const [customerType, setCustomerType] = useState(initialCustomerType);
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Handle customer type selection
  const handleCustomerTypeChange = (type) => {
    setCustomerType(type);
    if (type && !selectedCustomer) {
      setCurrentStep(2);
    }
  };

  // Handle customer selection from search
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowRegistrationForm(false);
    if (customer && customerType) {
      setCurrentStep(3);
    }
  };

  // Handle new customer creation
  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setShowRegistrationForm(false);
    if (newCustomer && customerType) {
      setCurrentStep(3);
    }
  };

  // Handle showing registration form
  const handleShowRegistrationForm = () => {
    setShowRegistrationForm(true);
    setSelectedCustomer(null);
  };

  // Handle canceling registration form
  const handleCancelRegistration = () => {
    setShowRegistrationForm(false);
  };

  // Handle clearing customer selection
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setShowRegistrationForm(false);
    setCurrentStep(2);
  };

  // Handle completing the selection
  const handleCompleteSelection = () => {
    if (customerType && selectedCustomer && onSelectionComplete) {
      onSelectionComplete({
        customerType,
        customer: selectedCustomer
      });
    }
  };

  // Handle resetting everything
  const handleReset = () => {
    setCustomerType(null);
    setSelectedCustomer(null);
    setShowRegistrationForm(false);
    setCurrentStep(1);
  };

  const isSelectionComplete = customerType && selectedCustomer;

  return (
    <Container fluid>
      <Row>
        <Col>
          {/* Progress indicator */}
          <Card className="mb-4">
            <Card.Body className="py-2">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className={`badge ${currentStep >= 1 ? 'bg-primary' : 'bg-secondary'} me-2`}>1</span>
                  <span className={currentStep >= 1 ? 'fw-bold' : 'text-muted'}>Select Customer Type</span>
                  
                  <span className="mx-2">→</span>
                  
                  <span className={`badge ${currentStep >= 2 ? 'bg-primary' : 'bg-secondary'} me-2`}>2</span>
                  <span className={currentStep >= 2 ? 'fw-bold' : 'text-muted'}>Choose Customer</span>
                  
                  <span className="mx-2">→</span>
                  
                  <span className={`badge ${currentStep >= 3 ? 'bg-success' : 'bg-secondary'} me-2`}>3</span>
                  <span className={currentStep >= 3 ? 'fw-bold text-success' : 'text-muted'}>Complete</span>
                </div>
                
                {(customerType || selectedCustomer) && (
                  <Button variant="outline-secondary" size="sm" onClick={handleReset}>
                    Start Over
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Step 1: Customer Type Selection */}
          <CustomerTypeSelection
            selectedType={customerType}
            onTypeChange={handleCustomerTypeChange}
            disabled={disabled}
          />

          {/* Step 2: Customer Selection/Registration */}
          {customerType && !isSelectionComplete && (
            <>
              {!showRegistrationForm ? (
                <>
                  <CustomerSearch
                    onCustomerSelect={handleCustomerSelect}
                    selectedCustomer={selectedCustomer}
                    disabled={disabled}
                  />
                  
                  <Card className="mb-3">
                    <Card.Body className="text-center">
                      <p className="text-muted mb-3">Can't find the customer?</p>
                      <Button 
                        variant="outline-primary" 
                        onClick={handleShowRegistrationForm}
                        disabled={disabled}
                      >
                        Register New Customer
                      </Button>
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <CustomerRegistrationForm
                  onCustomerCreated={handleCustomerCreated}
                  onCancel={handleCancelRegistration}
                  disabled={disabled}
                />
              )}
            </>
          )}

          {/* Step 3: Selection Complete */}
          {isSelectionComplete && (
            <>
              <CustomerDetails
                customer={selectedCustomer}
                customerType={customerType}
                onClear={handleClearCustomer}
                showActions={!disabled}
              />
              
              {onSelectionComplete && (
                <Card>
                  <Card.Body className="text-center">
                    <Button 
                      variant="success" 
                      size="lg" 
                      onClick={handleCompleteSelection}
                      disabled={disabled}
                    >
                      Continue with Selected Customer
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerSelectionInterface;