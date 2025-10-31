import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import FormField from '../common/FormField';
import { SLAB_CATEGORIES } from '../../utils/constants';
import { calculationEngine } from '../../utils/calculationEngine';

const SlabEntryEditModal = ({ 
  show, 
  onHide, 
  onSave, 
  entry, 
  customerType 
}) => {
  const [formData, setFormData] = useState({
    blockNumber: '',
    length: '',
    breadth: '',
    slabCategory: ''
  });
  
  const [errors, setErrors] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        blockNumber: entry.blockNumber || '',
        length: entry.length?.toString() || '',
        breadth: entry.breadth?.toString() || '',
        slabCategory: entry.slabCategory || ''
      });
    }
  }, [entry]);

  // Real-time calculation
  useEffect(() => {
    if (formData.length && formData.breadth && customerType) {
      const length = parseFloat(formData.length);
      const breadth = parseFloat(formData.breadth);
      
      if (length > 0 && breadth > 0) {
        setIsCalculating(true);
        try {
          const result = calculationEngine.calculateSquareFeet(length, breadth, customerType);
          setCalculation(result);
        } catch (error) {
          console.error('Calculation error:', error);
          setCalculation(null);
        }
        setIsCalculating(false);
      } else {
        setCalculation(null);
      }
    } else {
      setCalculation(null);
    }
  }, [formData.length, formData.breadth, customerType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.blockNumber.trim()) {
      newErrors.blockNumber = 'Block number is required';
    }
    
    if (!formData.length) {
      newErrors.length = 'Length is required';
    } else {
      const length = parseFloat(formData.length);
      if (isNaN(length) || length <= 0) {
        newErrors.length = 'Length must be a positive number';
      }
    }
    
    if (!formData.breadth) {
      newErrors.breadth = 'Breadth is required';
    } else {
      const breadth = parseFloat(formData.breadth);
      if (isNaN(breadth) || breadth <= 0) {
        newErrors.breadth = 'Breadth must be a positive number';
      }
    }
    
    if (!formData.slabCategory) {
      newErrors.slabCategory = 'Slab category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    if (!calculation) {
      setErrors({ general: 'Unable to calculate square footage. Please check your inputs.' });
      return;
    }
    
    const updatedEntry = {
      ...entry,
      blockNumber: formData.blockNumber.trim(),
      length: parseFloat(formData.length),
      breadth: parseFloat(formData.breadth),
      slabCategory: formData.slabCategory,
      finalLength: calculation.finalLength,
      finalBreadth: calculation.finalBreadth,
      squareFeet: calculation.squareFeet,
      calculationDetails: calculation.rawCalculation
    };
    
    onSave(updatedEntry);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      blockNumber: '',
      length: '',
      breadth: '',
      slabCategory: ''
    });
    setErrors({});
    setCalculation(null);
    onHide();
  };

  const slabCategoryOptions = SLAB_CATEGORIES.map(category => ({
    value: category,
    label: category
  }));

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Slab Entry #{entry?.serialNumber}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {errors.general && (
          <Alert variant="danger" className="mb-3">
            {errors.general}
          </Alert>
        )}
        
        <Form>
          <Row>
            <Col md={6}>
              <FormField
                label="Block Number"
                name="blockNumber"
                value={formData.blockNumber}
                onChange={handleInputChange}
                error={errors.blockNumber}
                touched={!!errors.blockNumber}
                placeholder="Enter block number"
                required
              />
            </Col>
            
            <Col md={6}>
              <FormField
                label="Slab Category"
                name="slabCategory"
                as="select"
                value={formData.slabCategory}
                onChange={handleInputChange}
                error={errors.slabCategory}
                touched={!!errors.slabCategory}
                options={slabCategoryOptions}
                placeholder="Select category"
                required
              />
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <FormField
                label="Length (inches)"
                name="length"
                type="number"
                step="0.01"
                min="0"
                value={formData.length}
                onChange={handleInputChange}
                error={errors.length}
                touched={!!errors.length}
                placeholder="0.00"
                required
              />
            </Col>
            
            <Col md={6}>
              <FormField
                label="Breadth (inches)"
                name="breadth"
                type="number"
                step="0.01"
                min="0"
                value={formData.breadth}
                onChange={handleInputChange}
                error={errors.breadth}
                touched={!!errors.breadth}
                placeholder="0.00"
                required
              />
            </Col>
          </Row>
        </Form>
        
        {/* Real-time calculation display */}
        {calculation && (
          <div className="mt-4 p-3 bg-light rounded">
            <h6 className="text-success mb-2">
              <i className="bi bi-calculator"></i> Updated Calculation
            </h6>
            
            <Row>
              <Col md={4}>
                <small className="text-muted">Original Dimensions:</small>
                <div>{formData.length}" × {formData.breadth}"</div>
              </Col>
              
              <Col md={4}>
                <small className="text-muted">Final Dimensions:</small>
                <div>{calculation.finalLength}" × {calculation.finalBreadth}"</div>
              </Col>
              
              <Col md={4}>
                <small className="text-muted">Square Feet:</small>
                <div className="fw-bold text-success fs-5">
                  {calculation.squareFeet} sq ft
                </div>
              </Col>
            </Row>
            
            <div className="mt-2">
              <small className="text-muted">Calculation:</small>
              <div className="font-monospace small">
                {calculation.rawCalculation}
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={isCalculating || !calculation}
        >
          {isCalculating ? 'Calculating...' : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SlabEntryEditModal;