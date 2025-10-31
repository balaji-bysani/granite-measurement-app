import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import CustomButton from './CustomButton';

const CustomModal = ({
  show,
  onHide,
  title,
  children,
  size = 'lg',
  centered = true,
  showFooter = true,
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  loading = false,
  disableConfirm = false,
  ...props
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      {...props}
    >
      {title && (
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}
      
      <Modal.Body>
        {children}
      </Modal.Body>
      
      {showFooter && (
        <Modal.Footer>
          <Button
            variant={cancelVariant}
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          {onConfirm && (
            <CustomButton
              variant={confirmVariant}
              onClick={handleConfirm}
              loading={loading}
              disabled={disableConfirm}
            >
              {confirmText}
            </CustomButton>
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default CustomModal;