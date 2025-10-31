import React from 'react';
import { Form, Card } from 'react-bootstrap';

const CustomerTypeSelection = ({ selectedType, onTypeChange, disabled = false }) => {
  const customerTypes = [
    { value: 'retail', label: 'Retail', description: 'Direct calculation (L × B) ÷ 144' },
    { value: 'granite_shops', label: 'Granite Shops (Wholesalers)', description: 'Length-3, Breadth-2 with divisibility by 3' },
    { value: 'builders', label: 'Builders', description: 'Length-3 with divisibility by 3, original breadth' },
    { value: 'outstation_parties', label: 'Outstation Parties', description: 'Same as Granite Shops calculation' },
    { value: 'exporters', label: 'Exporters', description: 'Simple (L-3) × (B-2) ÷ 144' }
  ];

  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">Select Customer Type</h5>
        <small className="text-muted">Choose the customer type to apply the correct calculation method</small>
      </Card.Header>
      <Card.Body>
        <Form>
          {customerTypes.map((type) => (
            <Form.Check
              key={type.value}
              type="radio"
              id={`customer-type-${type.value}`}
              name="customerType"
              value={type.value}
              checked={selectedType === type.value}
              onChange={(e) => onTypeChange(e.target.value)}
              disabled={disabled}
              className="mb-3"
              label={
                <div>
                  <strong>{type.label}</strong>
                  <br />
                  <small className="text-muted">{type.description}</small>
                </div>
              }
            />
          ))}
        </Form>
        {selectedType && (
          <div className="alert alert-info mt-3">
            <strong>Selected:</strong> {customerTypes.find(t => t.value === selectedType)?.label}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CustomerTypeSelection;