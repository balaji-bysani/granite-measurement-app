import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

const CustomerDetails = ({ 
  customer, 
  customerType, 
  onEdit, 
  onClear, 
  showActions = true,
  compact = false 
}) => {
  if (!customer) {
    return null;
  }

  const customerTypeLabels = {
    retail: 'Retail',
    granite_shops: 'Granite Shops (Wholesalers)',
    builders: 'Builders',
    outstation_parties: 'Outstation Parties',
    exporters: 'Exporters'
  };

  const customerTypeVariants = {
    retail: 'primary',
    granite_shops: 'success',
    builders: 'warning',
    outstation_parties: 'info',
    exporters: 'secondary'
  };

  if (compact) {
    return (
      <Card className="mb-3">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{customer.name}</strong>
              <span className="text-muted ms-2">• {customer.phoneNumber}</span>
              {customerType && (
                <Badge 
                  bg={customerTypeVariants[customerType] || 'secondary'} 
                  className="ms-2"
                >
                  {customerTypeLabels[customerType] || customerType}
                </Badge>
              )}
            </div>
            {showActions && onClear && (
              <Button variant="outline-secondary" size="sm" onClick={onClear}>
                Change
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Customer Details</h5>
        {showActions && (
          <div className="d-flex gap-2">
            {onEdit && (
              <Button variant="outline-primary" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onClear && (
              <Button variant="outline-secondary" size="sm" onClick={onClear}>
                Clear Selection
              </Button>
            )}
          </div>
        )}
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label text-muted">Customer Name</label>
              <div className="fw-bold">{customer.name}</div>
            </div>
            
            <div className="mb-3">
              <label className="form-label text-muted">Phone Number</label>
              <div>{customer.phoneNumber}</div>
            </div>
          </div>
          
          <div className="col-md-6">
            {customer.email && (
              <div className="mb-3">
                <label className="form-label text-muted">Email</label>
                <div>{customer.email}</div>
              </div>
            )}
            
            {customerType && (
              <div className="mb-3">
                <label className="form-label text-muted">Customer Type</label>
                <div>
                  <Badge 
                    bg={customerTypeVariants[customerType] || 'secondary'} 
                    className="fs-6"
                  >
                    {customerTypeLabels[customerType] || customerType}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label text-muted">Address</label>
          <div>{customer.address}</div>
        </div>

        {customer.createdAt && (
          <div className="text-muted small">
            Customer since: {new Date(customer.createdAt).toLocaleDateString()}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CustomerDetails;