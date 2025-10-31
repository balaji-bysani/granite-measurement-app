import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { measurementSheetService } from '../services/measurementSheetService';
import { LoadingSpinner } from '../components/common';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentSheets, setRecentSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSheets: 0,
    completedSheets: 0,
    draftSheets: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent measurement sheets
      const sheetsResponse = await measurementSheetService.searchMeasurementSheets({
        page: 1,
        limit: 5
      });
      
      if (sheetsResponse.success) {
        setRecentSheets(sheetsResponse.data);
        
        // Calculate stats
        const totalSheets = sheetsResponse.pagination.total;
        const completedSheets = sheetsResponse.data.filter(sheet => sheet.status === 'completed').length;
        const draftSheets = sheetsResponse.data.filter(sheet => sheet.status === 'draft').length;
        
        setStats({
          totalSheets,
          completedSheets,
          draftSheets,
          totalCustomers: 15 // Mock data for now
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status) => {
    return status === 'completed' ? 'success' : 'warning';
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="text-muted">Granite Measurement Sheet Management System</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 border-primary">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-2">{stats.totalSheets}</div>
              <Card.Title className="h6">Total Sheets</Card.Title>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => navigate('/measurement-sheet/new')}
              >
                Create New
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 border-success">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-2">{stats.completedSheets}</div>
              <Card.Title className="h6">Completed</Card.Title>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => navigate('/measurement-sheets')}
              >
                View All
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 border-warning">
            <Card.Body className="text-center">
              <div className="display-4 text-warning mb-2">{stats.draftSheets}</div>
              <Card.Title className="h6">Draft Sheets</Card.Title>
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => navigate('/measurement-sheets')}
              >
                Manage
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100 border-info">
            <Card.Body className="text-center">
              <div className="display-4 text-info mb-2">{stats.totalCustomers}</div>
              <Card.Title className="h6">Customers</Card.Title>
              <Button 
                variant="info" 
                size="sm"
                onClick={() => navigate('/customers')}
              >
                Manage
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Measurement Sheets</h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => navigate('/measurement-sheets')}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-4">
                  <LoadingSpinner />
                  <div className="mt-2">Loading recent activity...</div>
                </div>
              ) : recentSheets.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted mb-3">No measurement sheets found.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/measurement-sheet/new')}
                  >
                    Create Your First Sheet
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Sheet Number</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Total Sq Ft</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSheets.map((sheet) => (
                      <tr key={sheet.id}>
                        <td>
                          <strong>{sheet.measurement_sheet_number}</strong>
                        </td>
                        <td>
                          <div>{sheet.customer_name}</div>
                          <small className="text-muted">{sheet.customer_phone}</small>
                        </td>
                        <td>{sheet.customer_type}</td>
                        <td>
                          <Badge bg={getStatusVariant(sheet.status)}>
                            {sheet.status}
                          </Badge>
                        </td>
                        <td>{sheet.total_square_feet?.toFixed(2) || '0.00'}</td>
                        <td>
                          <small>{formatDate(sheet.created_at)}</small>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/measurement-sheet/${sheet.id}`)}
                          >
                            View
                          </Button>
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
    </Container>
  );
};

export default Dashboard;