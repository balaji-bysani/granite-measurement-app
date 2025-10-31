import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <i className="fas fa-cut me-2"></i>
            Granite Measurement System
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/measurement-sheet/new">
              <Nav.Link>New Measurement Sheet</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/measurement-sheets">
              <Nav.Link>View Sheets</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/customers">
              <Nav.Link>Customers</Nav.Link>
            </LinkContainer>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;