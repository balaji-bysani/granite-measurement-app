import React from 'react';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

const LoadingSpinner = ({ 
  size = 'border', 
  variant = 'primary', 
  text = 'Loading...', 
  centered = true,
  fullPage = false,
  inline = false,
  className = ''
}) => {
  // For inline usage (like in buttons)
  if (inline) {
    return (
      <Spinner 
        animation={size} 
        variant={variant} 
        size={size === 'sm' ? 'sm' : undefined}
        className={className}
      />
    );
  }

  const spinner = (
    <div className="text-center">
      <Spinner animation={size} variant={variant} className="mb-2" />
      {text && <div className="text-muted">{text}</div>}
    </div>
  );

  if (fullPage) {
    return (
      <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
        <Row>
          <Col>
            {spinner}
          </Col>
        </Row>
      </Container>
    );
  }

  if (centered) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;