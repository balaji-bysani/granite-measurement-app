import React, { useState } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { CustomerSelectionInterface } from '../components/customer';

const CustomerManagement = () => {
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [showInterface, setShowInterface] = useState(false);

  const handleSelectionComplete = (customerData) => {
    setSelectedCustomerData(customerData);
    setShowInterface(false);
  };

  const handleStartNewSelection = () => {
    setSelectedCustomerData(null);
    setShowInterface(true);
  };

  const handleReset = () => {
    setSelectedCustomerData(null);
    setShowInterface(false);
  };

  return (
    <Container>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>Customer Management</h1>
              <p className="text-muted">Manage customer information and selection</p>
            </div>
            <div>
              {!showInterface && (
                <Button variant="primary" onClick={handleStartNewSelection}>
                  Select Customer
                </Button>
              )}
              {(showInterface || selectedCustomerData) && (
                <Button variant="outline-secondary" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          {selectedCustomerData && !showInterface && (
            <Alert variant="success">
              <Alert.Heading>Customer Selection Complete!</Alert.Heading>
              <p>
                <strong>Customer:</strong> {selectedCustomerData.customer.name}<br />
                <strong>Type:</strong> {selectedCustomerData.customerType}<br />
                <strong>Phone:</strong> {selectedCustomerData.customer.phoneNumber}
              </p>
              <hr />
              <p className="mb-0">
                You can now proceed to create a measurement sheet for this customer.
              </p>
            </Alert>
          )}

          {showInterface && (
            <CustomerSelectionInterface
              onSelectionComplete={handleSelectionComplete}
            />
          )}

          {!showInterface && !selectedCustomerData && (
            <div className="text-center py-5">
              <h3 className="text-muted">Customer Selection Interface</h3>
              <p className="text-muted mb-4">
                Use this interface to select customer types, search existing customers, 
                or register new customers for measurement sheets.
              </p>
              <Button variant="primary" size="lg" onClick={handleStartNewSelection}>
                Get Started
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerManagement;