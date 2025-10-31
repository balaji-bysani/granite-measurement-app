import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const CustomButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={className}
      {...props}
    >
      {loading && (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
      )}
      {children}
    </Button>
  );
};

export default CustomButton;