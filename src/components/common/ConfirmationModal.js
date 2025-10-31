import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import CustomButton from './CustomButton';

const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  size = 'md',
  loading = false,
  icon = null,
  details = null,
  showCancel = true,
  ...props
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'danger':
        return <i className="bi bi-exclamation-triangle-fill text-danger me-2" style={{ fontSize: '1.5rem' }}></i>;
      case 'warning':
        return <i className="bi bi-exclamation-circle-fill text-warning me-2" style={{ fontSize: '1.5rem' }}></i>;
      case 'info':
        return <i className="bi bi-info-circle-fill text-info me-2" style={{ fontSize: '1.5rem' }}></i>;
      case 'success':
        return <i className="bi bi-check-circle-fill text-success me-2" style={{ fontSize: '1.5rem' }}></i>;
      default:
        return <i className="bi bi-question-circle-fill text-secondary me-2" style={{ fontSize: '1.5rem' }}></i>;
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered
      backdrop={loading ? 'static' : true}
      keyboard={!loading}
      {...props}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title className="d-flex align-items-center">
          {getIcon()}
          {title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="mb-3">
          {typeof message === 'string' ? (
            <p className="mb-0">{message}</p>
          ) : (
            message
          )}
        </div>
        
        {details && (
          <Alert variant="light" className="mb-0">
            <small>{details}</small>
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        {showCancel && (
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}
        
        <CustomButton
          variant={variant}
          onClick={handleConfirm}
          loading={loading}
          disabled={loading}
        >
          {confirmText}
        </CustomButton>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;