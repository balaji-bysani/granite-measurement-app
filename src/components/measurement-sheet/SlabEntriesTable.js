import React from 'react';
import { Card, Table, Button, Badge, Alert } from 'react-bootstrap';

const SlabEntriesTable = ({ 
  slabEntries = [], 
  onEditEntry, 
  onDeleteEntry, 
  customerType,
  disabled = false 
}) => {
  const totalSquareFeet = slabEntries.reduce((sum, entry) => sum + entry.squareFeet, 0);

  if (slabEntries.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Slab Entries</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="text-center mb-0">
            <i className="bi bi-info-circle me-2"></i>
            No slab entries added yet. Use the form above to add your first slab entry.
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Slab Entries</h5>
          <small className="text-muted">{slabEntries.length} entries</small>
        </div>
        <div className="text-end">
          <div className="text-muted small">Total Square Feet</div>
          <div className="fs-4 fw-bold text-success">
            {totalSquareFeet.toFixed(2)} sq ft
          </div>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table className="mb-0" striped hover>
            <thead className="table-dark">
              <tr>
                <th>S.No</th>
                <th>Block No</th>
                <th>Length</th>
                <th>Breadth</th>
                <th>Category</th>
                <th>Final Dimensions</th>
                <th>Square Feet</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slabEntries.map((entry, index) => (
                <tr key={entry.id || index}>
                  <td className="fw-bold">{entry.serialNumber}</td>
                  <td>{entry.blockNumber}</td>
                  <td>{entry.length}"</td>
                  <td>{entry.breadth}"</td>
                  <td>
                    <Badge 
                      bg={entry.slabCategory === 'F' ? 'success' : 
                          entry.slabCategory === 'LD' ? 'warning' : 
                          entry.slabCategory === 'D' ? 'info' : 'secondary'}
                    >
                      {entry.slabCategory}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-muted small">
                      {entry.finalLength}" × {entry.finalBreadth}"
                    </span>
                  </td>
                  <td className="fw-bold text-success">
                    {entry.squareFeet.toFixed(2)}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onEditEntry(entry, index)}
                        disabled={disabled}
                        title="Edit entry"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDeleteEntry(index)}
                        disabled={disabled}
                        title="Delete entry"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan="6" className="text-end fw-bold">
                  Total Square Feet:
                </td>
                <td className="fw-bold text-success fs-5">
                  {totalSquareFeet.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SlabEntriesTable;