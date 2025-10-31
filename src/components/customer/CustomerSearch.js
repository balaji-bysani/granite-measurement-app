import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { customerService } from '../../services/customerService';

const CustomerSearch = ({ onCustomerSelect, selectedCustomer, disabled = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Debounced search function
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchTerm.trim());
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setError(null);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const performSearch = async (term) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await customerService.searchCustomers(term);
      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      setError('Failed to search customers. Please try again.');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSearchTerm(`${customer.name} - ${customer.phoneNumber}`);
    setShowResults(false);
    onCustomerSelect(customer);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (selectedCustomer && e.target.value !== `${selectedCustomer.name} - ${selectedCustomer.phoneNumber}`) {
      onCustomerSelect(null); // Clear selection if user types something different
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">Search Existing Customer</h5>
        <small className="text-muted">Search by name, phone number, or email</small>
      </Card.Header>
      <Card.Body>
        <div className="position-relative">
          <Form.Group>
            <Form.Label>Customer Search</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="text"
                placeholder="Type customer name, phone number, or email..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={disabled}
                className="me-2"
              />
              {isLoading && <Spinner animation="border" size="sm" />}
            </div>
          </Form.Group>

          {error && (
            <Alert variant="danger" className="mt-2">
              {error}
            </Alert>
          )}

          {showResults && searchResults.length > 0 && (
            <Card className="position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
              <ListGroup variant="flush">
                {searchResults.map((customer) => (
                  <ListGroup.Item
                    key={customer.id}
                    action
                    onClick={() => handleCustomerSelect(customer)}
                    className="cursor-pointer"
                  >
                    <div>
                      <strong>{customer.name}</strong>
                      <br />
                      <small className="text-muted">
                        {customer.phoneNumber}
                        {customer.email && ` • ${customer.email}`}
                      </small>
                      <br />
                      <small className="text-muted">{customer.address}</small>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}

          {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isLoading && (
            <Card className="position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
              <Card.Body className="text-center text-muted">
                No customers found matching "{searchTerm}"
              </Card.Body>
            </Card>
          )}
        </div>

        {selectedCustomer && (
          <div className="alert alert-success mt-3">
            <strong>Selected Customer:</strong> {selectedCustomer.name}
            <br />
            <small>
              Phone: {selectedCustomer.phoneNumber}
              {selectedCustomer.email && ` • Email: ${selectedCustomer.email}`}
              <br />
              Address: {selectedCustomer.address}
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CustomerSearch;