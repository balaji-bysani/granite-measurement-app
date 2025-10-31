import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { CUSTOMER_TYPE_LABELS } from '../../utils/constants';

const MeasurementSheetHeader = ({ 
  measurementSheetNumber, 
  customer, 
  customerType, 
  createdAt,
  totalSquareFeet = 0,
  slabCount = 0
}) => {
  const getCustomerTypeDisplay = (type) => {
    return CUSTOMER_TYPE_LABELS[type] || type;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mb-4 border-primary">
      <Card.Header className="bg-primary text-white">
        <Row className="align-items-center">
          <Col>
            <h4 className="mb-0">
              Measurement Sheet #{measurementSheetNumber || 'NEW'}
            </h4>
          </Col>
          <Col xs="auto">
            <Badge bg="light" text="dark" className="fs-6">
              {slabCount} Slab{slabCount !== 1 ? 's' : ''}
            </Badge>
          </Col>
        </Row>
      </Card.Header>
      
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <h6 className="text-muted mb-1">Customer Information</h6>
              <div>
                <strong>{customer?.name || 'N/A'}</strong>
                {customer?.phoneNumber && (
                  <div className="text-muted small">
                    📞 {customer.phoneNumber}
                  </div>
                )}
                {customer?.email && (
                  <div className="text-muted small">
                    ✉️ {customer.email}
                  </div>
                )}
                {customer?.address && (
                  <div className="text-muted small">
                    📍 {customer.address}
                  </div>
                )}
              </div>
            </div>
          </Col>
          
          <Col md={3}>
            <div className="mb-3">
              <h6 className="text-muted mb-1">Customer Type</h6>
              <Badge bg="info" className="fs-6">
                {getCustomerTypeDisplay(customerType)}
              </Badge>
            </div>
          </Col>
          
          <Col md={3}>
            <div className="mb-3">
              <h6 className="text-muted mb-1">Total Square Feet</h6>
              <div className="fs-4 fw-bold text-success">
                {totalSquareFeet.toFixed(2)} sq ft
              </div>
            </div>
          </Col>
        </Row>
        
        {createdAt && (
          <Row>
            <Col>
              <small className="text-muted">
                Created: {formatDate(createdAt)}
              </small>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default MeasurementSheetHeader;