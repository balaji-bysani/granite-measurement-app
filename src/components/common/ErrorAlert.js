import React, { useState, useEffect } from 'react';
import { Alert, Button, Collapse } from 'react-bootstrap';

const ErrorAlert = ({
  error,
  onDismiss,
  variant = 'danger',
  dismissible = true,
  autoHide = false,
  autoHideDelay = 5000,
  showDetails = false,
  title = null,
  className = '',
  ...props
}) => {
  const [show, setShow] = useState(true);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setShow(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  };

  const getErrorDetails = () => {
    if (typeof error === 'string') {
      return null;
    }
    
    const details = [];
    
    if (error?.response?.status) {
      details.push(`Status: ${error.response.status}`);
    }
    
    if (error?.response?.data?.details) {
      if (Array.isArray(error.response.data.details)) {
        details.push(...error.response.data.details);
      } else {
        details.push(error.response.data.details);
      }
    }
    
    if (error?.stack && process.env.NODE_ENV === 'development') {
      details.push(`Stack: ${error.stack}`);
    }
    
    return details.length > 0 ? details : null;
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <i className="bi bi-exclamation-triangle-fill me-2"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-circle-fill me-2"></i>;
      case 'info':
        return <i className="bi bi-info-circle-fill me-2"></i>;
      case 'success':
        return <i className="bi bi-check-circle-fill me-2"></i>;
      default:
        return <i className="bi bi-exclamation-circle me-2"></i>;
    }
  };

  if (!show || !error) {
    return null;
  }

  const errorDetails = getErrorDetails();
  const hasDetails = showDetails && errorDetails && errorDetails.length > 0;

  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onClose={handleDismiss}
      className={className}
      {...props}
    >
      <div className="d-flex align-items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-grow-1">
          {title && (
            <Alert.Heading className="h6 mb-2">
              {title}
            </Alert.Heading>
          )}
          
          <div className="mb-0">
            {getErrorMessage()}
          </div>
          
          {hasDetails && (
            <div className="mt-2">
              <Button
                variant={`outline-${variant}`}
                size="sm"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                aria-expanded={showErrorDetails}
              >
                <i className={`bi bi-chevron-${showErrorDetails ? 'up' : 'down'} me-1`}></i>
                {showErrorDetails ? 'Hide' : 'Show'} Details
              </Button>
              
              <Collapse in={showErrorDetails}>
                <div className="mt-2">
                  <div className="bg-light p-2 rounded small">
                    {errorDetails.map((detail, index) => (
                      <div key={index} className="mb-1">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default ErrorAlert;