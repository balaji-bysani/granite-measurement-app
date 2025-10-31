import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Table, 
  Pagination, 
  Badge, 
  Dropdown,
  Modal,
  Alert,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { measurementSheetService } from '../services/measurementSheetService';
import { exportService } from '../services/exportService';
import { CUSTOMER_TYPE_LABELS, MEASUREMENT_SHEET_STATUS, ROUTES } from '../utils/constants';
import { LoadingSpinner, VirtualizedTable } from '../components/common';
import { useDebounce, useCache } from '../hooks/useVirtualScrolling';

const MeasurementSheetList = () => {
  const navigate = useNavigate();
  
  // State management
  const [measurementSheets, setMeasurementSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    customerType: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [selectedSheets, setSelectedSheets] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  
  // Use custom hooks for performance optimization
  const debouncedSearch = useDebounce(searchTerm, 300);
  const cache = useCache(300000); // 5 minutes cache

  // Update debounced search term when custom hook value changes
  useEffect(() => {
    setDebouncedSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  // Fetch measurement sheets with caching
  const fetchMeasurementSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const criteria = {
        search: debouncedSearchTerm,
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty values
      Object.keys(criteria).forEach(key => {
        if (criteria[key] === '' || criteria[key] === null || criteria[key] === undefined) {
          delete criteria[key];
        }
      });

      // Create cache key
      const cacheKey = `measurement_sheets_${JSON.stringify(criteria)}`;
      
      // Try to get from cache first
      let response = cache.get(cacheKey);
      
      if (!response) {
        response = await measurementSheetService.searchMeasurementSheets(criteria);
        
        // Cache successful responses
        if (response.success) {
          cache.set(cacheKey, response);
        }
      }
      
      if (response.success) {
        setMeasurementSheets(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages
        }));
        
        // Enable virtual scrolling for large datasets
        setUseVirtualScrolling(response.data.length > 100);
      } else {
        throw new Error('Failed to fetch measurement sheets');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching measurement sheets:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters, pagination.page, pagination.limit, cache]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchMeasurementSheets();
  }, [fetchMeasurementSheets]);

  // Reset page when search or filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearchTerm, filters, pagination.page]);

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilters({
      customerType: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle checkbox selection
  const handleSelectSheet = (sheetId) => {
    const newSelected = new Set(selectedSheets);
    if (newSelected.has(sheetId)) {
      newSelected.delete(sheetId);
    } else {
      newSelected.add(sheetId);
    }
    setSelectedSheets(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSheets.size === measurementSheets.length) {
      setSelectedSheets(new Set());
    } else {
      setSelectedSheets(new Set(measurementSheets.map(sheet => sheet.id)));
    }
  };

  // Action handlers with loading states
  const handleView = (sheetId) => {
    navigate(`${ROUTES.VIEW_MEASUREMENT_SHEET}/${sheetId}`);
  };

  const handleEdit = (sheetId) => {
    navigate(`${ROUTES.EDIT_MEASUREMENT_SHEET}/${sheetId}`);
  };

  const handleDelete = (sheet) => {
    setSheetToDelete(sheet);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!sheetToDelete) return;

    try {
      setActionLoading(prev => ({ ...prev, [sheetToDelete.id]: true }));
      
      const response = await measurementSheetService.deleteMeasurementSheet(sheetToDelete.id);
      
      if (response.success) {
        // Remove from local state
        setMeasurementSheets(prev => prev.filter(sheet => sheet.id !== sheetToDelete.id));
        setSelectedSheets(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(sheetToDelete.id);
          return newSelected;
        });
        
        // Update pagination total
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
          pages: Math.ceil((prev.total - 1) / prev.limit)
        }));
      } else {
        throw new Error('Failed to delete measurement sheet');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [sheetToDelete.id]: false }));
      setShowDeleteModal(false);
      setSheetToDelete(null);
    }
  };

  const handleExport = async (sheetId, format) => {
    try {
      setActionLoading(prev => ({ ...prev, [`${sheetId}_${format}`]: true }));
      
      // First get the measurement sheet data
      const measurementSheet = await measurementSheetService.getMeasurementSheet(sheetId);
      
      let filename;
      
      if (format === 'pdf') {
        const blob = await exportService.generatePDF(measurementSheet);
        filename = `measurement-sheet-${measurementSheet.measurementSheetNumber}.pdf`;
        exportService.downloadFile(blob, filename, 'application/pdf');
      } else if (format === 'csv') {
        const csvData = await exportService.generateCSV(measurementSheet);
        filename = `measurement-sheet-${measurementSheet.measurementSheetNumber}.csv`;
        exportService.downloadFile(csvData, filename, 'text/csv');
      }
      
    } catch (err) {
      setError(`Failed to export ${format.toUpperCase()}: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${sheetId}_${format}`]: false }));
    }
  };

  const handlePrint = (sheetId) => {
    // Open measurement sheet in new window for printing
    const printUrl = `${ROUTES.VIEW_MEASUREMENT_SHEET}/${sheetId}?print=true`;
    window.open(printUrl, '_blank');
  };

  // Memoized pagination component
  const paginationComponent = useMemo(() => {
    if (pagination.pages <= 1) return null;

    const items = [];
    const maxVisiblePages = 5;
    const currentPage = pagination.page;
    const totalPages = pagination.pages;

    // Calculate start and end pages
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />
        {items}
        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        />
      </Pagination>
    );
  }, [pagination.page, pagination.pages]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case MEASUREMENT_SHEET_STATUS.COMPLETED:
        return 'success';
      case MEASUREMENT_SHEET_STATUS.DRAFT:
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Table columns configuration for virtualized table
  const tableColumns = useMemo(() => [
    {
      key: 'select',
      label: '',
      width: '50px'
    },
    {
      key: 'measurement_sheet_number',
      label: 'Sheet Number',
      width: '150px',
      render: (item) => <strong>{item.measurement_sheet_number}</strong>
    },
    {
      key: 'customer_name',
      label: 'Customer',
      width: '200px',
      render: (item) => (
        <div>
          <div>{item.customer_name}</div>
          <small className="text-muted">{item.customer_phone}</small>
        </div>
      )
    },
    {
      key: 'customer_type',
      label: 'Type',
      width: '150px'
    },
    {
      key: 'total_square_feet',
      label: 'Total Sq Ft',
      width: '120px',
      type: 'number'
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      type: 'badge',
      getBadgeVariant: getStatusVariant
    },
    {
      key: 'created_at',
      label: 'Created',
      width: '150px',
      type: 'date'
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'edit', label: 'Edit' },
        { key: 'export_pdf', label: 'Export PDF', divider: true, loadingText: 'Exporting' },
        { key: 'export_csv', label: 'Export CSV', loadingText: 'Exporting' },
        { key: 'print', label: 'Print' },
        { key: 'delete', label: 'Delete', divider: true, variant: 'danger' }
      ]
    }
  ], []);

  // Handle table actions
  const handleTableAction = useCallback(async (action, sheet) => {
    switch (action) {
      case 'view':
        handleView(sheet.id);
        break;
      case 'edit':
        handleEdit(sheet.id);
        break;
      case 'export_pdf':
        await handleExport(sheet.id, 'pdf');
        break;
      case 'export_csv':
        await handleExport(sheet.id, 'csv');
        break;
      case 'print':
        handlePrint(sheet.id);
        break;
      case 'delete':
        handleDelete(sheet);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }, [handleView, handleEdit, handleExport, handlePrint, handleDelete]);

  if (loading && measurementSheets.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Measurement Sheets</h1>
              <p className="text-muted">
                Manage and search measurement sheets ({pagination.total} total)
                {useVirtualScrolling && (
                  <Badge bg="info" className="ms-2">
                    Virtual Scrolling Active
                  </Badge>
                )}
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => navigate(ROUTES.NEW_MEASUREMENT_SHEET)}
            >
              Create New Sheet
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search by sheet number or customer name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      {searchTerm && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchTerm('')}
                        >
                          ×
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Customer Type</Form.Label>
                    <Form.Select
                      value={filters.customerType}
                      onChange={(e) => handleFilterChange('customerType', e.target.value)}
                    >
                      <option value="">All Types</option>
                      {Object.entries(CUSTOMER_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={label}>{label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value={MEASUREMENT_SHEET_STATUS.DRAFT}>Draft</option>
                      <option value={MEASUREMENT_SHEET_STATUS.COMPLETED}>Completed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Button variant="outline-secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  {selectedSheets.size > 0 && (
                    <span className="ms-3 text-muted">
                      {selectedSheets.size} sheet(s) selected
                    </span>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results Table */}
      <Row>
        <Col>
          <Card>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : measurementSheets.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">No measurement sheets found.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate(ROUTES.NEW_MEASUREMENT_SHEET)}
                  >
                    Create First Sheet
                  </Button>
                </div>
              ) : useVirtualScrolling ? (
                <VirtualizedTable
                  data={measurementSheets}
                  columns={tableColumns}
                  rowHeight={60}
                  containerHeight={500}
                  selectedRows={selectedSheets}
                  onRowSelect={handleSelectSheet}
                  onSelectAll={handleSelectAll}
                  actionLoading={actionLoading}
                  onAction={handleTableAction}
                />
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>
                        <Form.Check
                          type="checkbox"
                          checked={selectedSheets.size === measurementSheets.length && measurementSheets.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Sheet Number</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Total Sq Ft</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurementSheets.map((sheet) => (
                      <tr key={sheet.id}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedSheets.has(sheet.id)}
                            onChange={() => handleSelectSheet(sheet.id)}
                          />
                        </td>
                        <td>
                          <strong>{sheet.measurement_sheet_number}</strong>
                        </td>
                        <td>
                          <div>
                            <div>{sheet.customer_name}</div>
                            <small className="text-muted">{sheet.customer_phone}</small>
                          </div>
                        </td>
                        <td>{sheet.customer_type}</td>
                        <td>{sheet.total_square_feet?.toFixed(2) || '0.00'}</td>
                        <td>
                          <Badge bg={getStatusVariant(sheet.status)}>
                            {sheet.status}
                          </Badge>
                        </td>
                        <td>
                          <small>{formatDate(sheet.created_at)}</small>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant="outline-secondary" 
                              size="sm"
                              disabled={actionLoading[sheet.id]}
                            >
                              {actionLoading[sheet.id] ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                'Actions'
                              )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleView(sheet.id)}>
                                View
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleEdit(sheet.id)}>
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleExport(sheet.id, 'pdf')}
                                disabled={actionLoading[`${sheet.id}_pdf`]}
                              >
                                {actionLoading[`${sheet.id}_pdf`] ? 'Exporting...' : 'Export PDF'}
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleExport(sheet.id, 'csv')}
                                disabled={actionLoading[`${sheet.id}_csv`]}
                              >
                                {actionLoading[`${sheet.id}_csv`] ? 'Exporting...' : 'Export CSV'}
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handlePrint(sheet.id)}>
                                Print
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleDelete(sheet)}
                                className="text-danger"
                              >
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pagination */}
      {paginationComponent && (
        <Row className="mt-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              {paginationComponent}
            </div>
          </Col>
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete measurement sheet{' '}
          <strong>{sheetToDelete?.measurement_sheet_number}</strong>?
          <br />
          <small className="text-muted">This action cannot be undone.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={actionLoading[sheetToDelete?.id]}
          >
            {actionLoading[sheetToDelete?.id] ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MeasurementSheetList;